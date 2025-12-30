// Indian States with their GST State Codes
export interface IndianState {
  name: string;
  code: string;
}

export const indianStates: IndianState[] = [
  { name: 'Andaman and Nicobar Islands', code: '35' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
  { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Ladakh', code: '38' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Puducherry', code: '34' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
];

export const getStateByCode = (code: string): IndianState | undefined => {
  return indianStates.find(state => state.code === code);
};

export const getStateByName = (name: string): IndianState | undefined => {
  return indianStates.find(state => state.name.toLowerCase() === name.toLowerCase());
};

// Validate GSTIN format and extract state code
export const validateGSTIN = (gstin: string): { valid: boolean; stateCode?: string; error?: string } => {
  if (!gstin) return { valid: false, error: 'GSTIN is required' };
  
  // GSTIN format: 2 digit state code + 10 char PAN + 1 char entity number + Z + 1 check digit
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(gstin.toUpperCase())) {
    return { valid: false, error: 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5' };
  }
  
  const stateCode = gstin.substring(0, 2);
  const state = getStateByCode(stateCode);
  
  if (!state) {
    return { valid: false, error: 'Invalid state code in GSTIN' };
  }
  
  return { valid: true, stateCode };
};

// Calculate GST based on buyer and seller state
export const calculateGST = (
  taxableAmount: number,
  buyerStateCode: string,
  sellerStateCode: string,
  gstRate: number = 18
): { cgst: number; sgst: number; igst: number; total: number } => {
  const halfRate = gstRate / 2;
  
  if (buyerStateCode === sellerStateCode) {
    // Intra-state: CGST + SGST
    const cgst = (taxableAmount * halfRate) / 100;
    const sgst = (taxableAmount * halfRate) / 100;
    return { cgst, sgst, igst: 0, total: cgst + sgst };
  } else {
    // Inter-state: IGST
    const igst = (taxableAmount * gstRate) / 100;
    return { cgst: 0, sgst: 0, igst, total: igst };
  }
};
