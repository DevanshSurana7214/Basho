import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Building2, CreditCard, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { indianStates, validateGSTIN } from '@/lib/indianStates';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BusinessSettings {
  id: string;
  gstin: string | null;
  legal_name: string;
  trade_name: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  phone: string | null;
  email: string | null;
  pan: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
}

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<BusinessSettings>>({});
  const [gstinError, setGstinError] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as BusinessSettings | null;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<BusinessSettings>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('business_settings')
          .update(data)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const insertData = {
          legal_name: data.legal_name || '',
          address_line1: data.address_line1 || '',
          city: data.city || '',
          state: data.state || '',
          state_code: data.state_code || '',
          pincode: data.pincode || '',
          ...data,
        };
        const { error } = await supabase
          .from('business_settings')
          .insert([insertData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast.success('Business settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings: ' + error.message);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'gstin' && value) {
      const validation = validateGSTIN(value);
      setGstinError(validation.valid ? null : validation.error || null);
    } else if (name === 'gstin') {
      setGstinError(null);
    }
  };

  const handleStateChange = (value: string) => {
    const state = indianStates.find(s => s.code === value);
    if (state) {
      setFormData(prev => ({ 
        ...prev, 
        state: state.name, 
        state_code: state.code 
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.gstin) {
      const validation = validateGSTIN(formData.gstin);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid GSTIN');
        return;
      }
    }
    
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-serif text-xl">Business Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your business details for GST invoices
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GST Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              GST Information
            </CardTitle>
            <CardDescription>
              Your GST registration details for invoice generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Update these details with your actual GSTIN before going live. Currently using dummy data.
              </AlertDescription>
            </Alert>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN *</Label>
                <Input
                  id="gstin"
                  name="gstin"
                  value={formData.gstin || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 24AXXXX1234X1Z5"
                  className={gstinError ? 'border-destructive' : ''}
                />
                {gstinError && (
                  <p className="text-xs text-destructive">{gstinError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  name="pan"
                  value={formData.pan || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., AXXXX1234X"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legal_name">Legal Business Name *</Label>
                <Input
                  id="legal_name"
                  name="legal_name"
                  value={formData.legal_name || ''}
                  onChange={handleInputChange}
                  placeholder="Registered company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade_name">Trade Name</Label>
                <Input
                  id="trade_name"
                  name="trade_name"
                  value={formData.trade_name || ''}
                  onChange={handleInputChange}
                  placeholder="Brand/Trade name"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Address</CardTitle>
            <CardDescription>
              Registered business address for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                name="address_line1"
                value={formData.address_line1 || ''}
                onChange={handleInputChange}
                placeholder="Street address, building name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                name="address_line2"
                value={formData.address_line2 || ''}
                onChange={handleInputChange}
                placeholder="Area, landmark"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Select 
                  value={formData.state_code || ''} 
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map(state => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={formData.pincode || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="Business contact number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  placeholder="Business email"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Bank account details for invoices (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  value={formData.bank_name || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_branch">Branch</Label>
                <Input
                  id="bank_branch"
                  name="bank_branch"
                  value={formData.bank_branch || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  name="bank_account_number"
                  value={formData.bank_account_number || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_ifsc">IFSC Code</Label>
                <Input
                  id="bank_ifsc"
                  name="bank_ifsc"
                  value={formData.bank_ifsc || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
