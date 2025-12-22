import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import logoNew from "@/assets/logo-new.png";

// Product images for animated rows
import oceanBlueMugs from "@/assets/products/ocean-blue-mugs.jpg";
import forestGreenTeaSet from "@/assets/products/forest-green-tea-set.jpg";
import terracottaFruitBowls from "@/assets/products/terracotta-fruit-bowls.jpg";
import minimalistCreamMugs from "@/assets/products/minimalist-cream-mugs.jpg";
import cloudServingPlatters from "@/assets/products/cloud-serving-platters.jpg";
import hexagonalPastelPlates from "@/assets/products/hexagonal-pastel-plates.jpg";
import rusticDuoMugSet from "@/assets/products/rustic-duo-mug-set.jpg";
import indigoPlanters from "@/assets/products/indigo-planters.jpg";
import organicEdgePlatters from "@/assets/products/organic-edge-platters.jpg";
import meadowFlowerMugs from "@/assets/products/meadow-flower-mugs.jpg";
import songbirdTeaSet from "@/assets/products/songbird-tea-set.jpg";
import ribbedDualToneBowls from "@/assets/products/ribbed-dual-tone-bowls.jpg";
import workshopPieces1 from "@/assets/gallery/workshop-pieces-1.png";
import workshopPieces3 from "@/assets/gallery/workshop-pieces-3.png";
import workshopPieces5 from "@/assets/gallery/workshop-pieces-5.png";
import workshopPieces7 from "@/assets/gallery/workshop-pieces-7.png";
import earthToneServingPlates from "@/assets/products/earth-tone-serving-plates.jpg";
import cuppedHandsSculpture from "@/assets/products/cupped-hands-sculpture.jpg";

// Image arrays for rows
const row1Images = [
  oceanBlueMugs, forestGreenTeaSet, terracottaFruitBowls, minimalistCreamMugs, cloudServingPlatters, hexagonalPastelPlates,
  oceanBlueMugs, forestGreenTeaSet, terracottaFruitBowls, minimalistCreamMugs, cloudServingPlatters, hexagonalPastelPlates,
];
const row2Images = [
  rusticDuoMugSet, indigoPlanters, organicEdgePlatters, meadowFlowerMugs, songbirdTeaSet, ribbedDualToneBowls,
  rusticDuoMugSet, indigoPlanters, organicEdgePlatters, meadowFlowerMugs, songbirdTeaSet, ribbedDualToneBowls,
];
const row3Images = [
  workshopPieces1, workshopPieces3, workshopPieces5, workshopPieces7, earthToneServingPlates, cuppedHandsSculpture,
  workshopPieces1, workshopPieces3, workshopPieces5, workshopPieces7, earthToneServingPlates, cuppedHandsSculpture,
];

import PasswordStrengthIndicator, { validatePassword } from "@/components/PasswordStrengthIndicator";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15, "Phone must be less than 15 digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(1, "Password is required"),
});

type AuthStep = "form" | "otp" | "forgot-password" | "reset-otp" | "new-password";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>("form");
  const [otpValue, setOtpValue] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    // Don't redirect if we're in the password reset flow
    if (user && authStep !== "new-password" && authStep !== "reset-otp") {
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo, authStep]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    try {
      if (isLogin) {
        signInSchema.parse({ email: formData.email, password: formData.password });
      } else {
        signUpSchema.parse(formData);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const updateProfilePhone = async (userId: string, phone: string) => {
    await supabase
      .from('profiles')
      .update({ phone })
      .eq('user_id', userId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else if (error.message.includes("Email not confirmed")) {
            // User hasn't verified email yet, show OTP input
            setPendingEmail(formData.email);
            setAuthStep("otp");
            toast({
              title: "Email Verification Required",
              description: "Please check your email for the verification code.",
            });
          } else {
            toast({
              title: "Login Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
        }
      } else {
        const { error, data } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign Up Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          if (data?.user) {
            setTimeout(() => updateProfilePhone(data.user.id, formData.phone), 500);
          }
          // Show OTP verification step
          setPendingEmail(formData.email);
          setAuthStep("otp");
          toast({
            title: "Verification Code Sent",
            description: "Please check your email for the 6-digit verification code.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpValue,
        type: "email",
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message || "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Verified!",
          description: "Your account has been verified successfully.",
        });
        // User will be automatically signed in and redirected via useEffect
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
      });

      if (error) {
        toast({
          title: "Failed to Resend",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email.",
        });
        setOtpValue("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setAuthStep("form");
    setOtpValue("");
    setPendingEmail("");
    setResetEmail("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const emailSchema = z.string().email("Invalid email address");
    const result = emailSchema.safeParse(resetEmail);
    if (!result.success) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setPendingEmail(resetEmail);
        setAuthStep("reset-otp");
        toast({
          title: "Reset Code Sent",
          description: "Please check your email for the 6-digit reset code.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit reset code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpValue,
        type: "recovery",
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message || "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
      } else {
        // Important: Set authStep BEFORE the useEffect can trigger a redirect
        // The verifyOtp with type "recovery" automatically logs in the user
        setAuthStep("new-password");
        setOtpValue("");
        toast({
          title: "Code Verified",
          description: "Please enter your new password.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!validatePassword(newPassword)) {
      toast({
        title: "Weak Password",
        description: "Password must meet all requirements.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
        handleBackToForm();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(pendingEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Failed to Resend",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code Resent",
          description: "A new reset code has been sent to your email.",
        });
        setOtpValue("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: "Google Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? "Sign In" : "Sign Up"} | Bosco By Shivangi</title>
        <meta
          name="description"
          content="Sign in or create an account at Bosco to manage your orders and workshop bookings."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex">
        {/* Left Side - Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full lg:w-1/2 px-6 md:px-12 lg:px-16 xl:px-24 flex flex-col justify-center min-h-screen"
        >
          <div className="max-w-md mx-auto w-full">
              {/* Logo */}
              <motion.div 
                className="flex justify-center mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Link to="/" className="transition-transform hover:scale-105">
                  <img 
                    src={logoNew} 
                    alt="Bosco By Shivangi" 
                    className="h-14 w-auto object-contain"
                  />
                </Link>
              </motion.div>

              {/* Header */}
              <motion.div 
                className="text-center mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="text-[10px] tracking-[0.4em] uppercase text-primary/70 font-medium mb-2">
                  {authStep === "otp" ? "Verification" : authStep === "forgot-password" ? "Password Reset" : authStep === "reset-otp" ? "Verification" : authStep === "new-password" ? "New Password" : isLogin ? "Welcome Back" : "Join Us"}
                </p>
                <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">
                  {authStep === "otp" ? "Enter Code" : authStep === "forgot-password" ? "Forgot Password" : authStep === "reset-otp" ? "Enter Code" : authStep === "new-password" ? "Set Password" : isLogin ? "Sign In" : "Create Account"}
                </h1>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto" />
              </motion.div>

              {/* Form Card - Enhanced */}
              <motion.div 
                className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-primary/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/20 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/20 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/20 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/20 rounded-br-2xl" />
                <AnimatePresence mode="wait">
                  {authStep === "forgot-password" ? (
                    <motion.div
                      key="forgot-password"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button
                        type="button"
                        onClick={handleBackToForm}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Sign In</span>
                      </button>

                      <div className="space-y-6">
                        <p className="text-muted-foreground text-sm">
                          Enter your email address and we'll send you a code to reset your password.
                        </p>

                        <div className="space-y-2">
                          <Label htmlFor="resetEmail" className="text-xs tracking-wider uppercase text-muted-foreground">
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="resetEmail"
                              type="email"
                              placeholder="you@example.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className="pl-12 h-12 lg:h-10 bg-background border-border"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <Button
                          onClick={handleForgotPassword}
                          className="w-full h-12 lg:h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-sm tracking-widest uppercase"
                          disabled={loading}
                        >
                          {loading ? "Sending..." : "Send Reset Code"}
                        </Button>
                      </div>
                    </motion.div>
                  ) : authStep === "reset-otp" ? (
                    <motion.div
                      key="reset-otp"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button
                        type="button"
                        onClick={() => setAuthStep("forgot-password")}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back</span>
                      </button>

                      <div className="text-center space-y-6">
                        <div className="space-y-2">
                          <p className="text-muted-foreground">
                            We sent a reset code to
                          </p>
                          <p className="font-medium text-foreground">{pendingEmail}</p>
                        </div>

                        <div className="flex justify-center py-4">
                          <InputOTP
                            maxLength={6}
                            value={otpValue}
                            onChange={setOtpValue}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>

                        <Button
                          onClick={handleVerifyResetOtp}
                          className="w-full h-12 lg:h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-sm tracking-widest uppercase"
                          disabled={loading || otpValue.length !== 6}
                        >
                          {loading ? "Verifying..." : "Verify Code"}
                        </Button>

                        <div className="pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">
                            Didn't receive the code?
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleResendResetOtp}
                            disabled={loading}
                            className="text-primary hover:text-primary/80"
                          >
                            Resend Code
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : authStep === "new-password" ? (
                    <motion.div
                      key="new-password"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-6">
                        <p className="text-muted-foreground text-sm">
                          Create a new password for your account.
                        </p>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-xs tracking-wider uppercase text-muted-foreground">
                            New Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="newPassword"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="pl-12 pr-12 h-12 lg:h-10 bg-background border-border"
                              disabled={loading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <PasswordStrengthIndicator password={newPassword} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-xs tracking-wider uppercase text-muted-foreground">
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="pl-12 h-12 lg:h-10 bg-background border-border"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <Button
                          onClick={handleSetNewPassword}
                          className="w-full h-12 lg:h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-sm tracking-widest uppercase"
                          disabled={loading}
                        >
                          {loading ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </motion.div>
                  ) : authStep === "otp" ? (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Back Button */}
                      <button
                        type="button"
                        onClick={handleBackToForm}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back</span>
                      </button>

                      <div className="text-center space-y-6">
                        <div className="space-y-2">
                          <p className="text-muted-foreground">
                            We sent a verification code to
                          </p>
                          <p className="font-medium text-foreground">{pendingEmail}</p>
                        </div>

                        {/* OTP Input */}
                        <div className="flex justify-center py-4">
                          <InputOTP
                            maxLength={6}
                            value={otpValue}
                            onChange={setOtpValue}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>

                        <Button
                          onClick={handleVerifyOtp}
                          className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-sm tracking-widest uppercase"
                          disabled={loading || otpValue.length !== 6}
                        >
                          {loading ? "Verifying..." : "Verify Email"}
                        </Button>

                        <div className="pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">
                            Didn't receive the code?
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleResendOtp}
                            disabled={loading}
                            className="text-primary hover:text-primary/80"
                          >
                            Resend Code
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Pill Toggle Buttons */}
                      <div className="relative flex bg-muted/50 rounded-full p-1 mb-6">
                        {/* Sliding background indicator */}
                        <motion.div
                          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-full shadow-sm"
                          animate={{ x: isLogin ? 0 : 'calc(100% + 4px)' }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                          type="button"
                          className={`relative flex-1 py-2.5 text-sm font-medium tracking-wide transition-colors duration-200 rounded-full z-10 ${
                            isLogin
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground/80"
                          }`}
                          onClick={() => {
                            setIsLogin(true);
                            setErrors({});
                          }}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          className={`relative flex-1 py-2.5 text-sm font-medium tracking-wide transition-colors duration-200 rounded-full z-10 ${
                            !isLogin
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground/80"
                          }`}
                          onClick={() => {
                            setIsLogin(false);
                            setErrors({});
                          }}
                        >
                          Sign Up
                        </button>
                      </div>

                      {/* Google Sign In - Enhanced */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mb-5 h-11 border-border/60 bg-background/50 hover:bg-background hover:border-primary/30 hover:shadow-md text-foreground rounded-xl transition-all duration-300 group"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                      >
                        <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continue with Google
                      </Button>

                      {/* Divider - Enhanced */}
                      <div className="relative mb-5">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                          <span className="bg-card/80 px-4 text-muted-foreground/70">
                            Or continue with email
                          </span>
                        </div>
                      </div>

                      {/* Form - Enhanced */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                          {!isLogin && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-4"
                            >
                              <div className="space-y-1.5">
                                <Label htmlFor="fullName" className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/80 font-medium">
                                  Full Name
                                </Label>
                                <div className="relative group">
                                  <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-focus-within:bg-primary/10 transition-colors">
                                      <User className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    </div>
                                  </div>
                                  <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="Your name"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className={`pl-12 h-11 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${errors.fullName ? 'border-destructive focus:border-destructive' : ''}`}
                                    disabled={loading}
                                  />
                                </div>
                                {errors.fullName && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[11px] text-destructive flex items-center gap-1"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-destructive" />
                                    {errors.fullName}
                                  </motion.p>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/80 font-medium">
                                  Phone Number
                                </Label>
                                <div className="relative group">
                                  <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-focus-within:bg-primary/10 transition-colors">
                                      <Phone className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    </div>
                                  </div>
                                  <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={`pl-12 h-11 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${errors.phone ? 'border-destructive focus:border-destructive' : ''}`}
                                    disabled={loading}
                                  />
                                </div>
                                {errors.phone && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[11px] text-destructive flex items-center gap-1"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-destructive" />
                                    {errors.phone}
                                  </motion.p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/80 font-medium">
                            Email
                          </Label>
                          <div className="relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-focus-within:bg-primary/10 transition-colors">
                                <Mail className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              </div>
                            </div>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="you@example.com"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`pl-12 h-11 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${errors.email ? 'border-destructive focus:border-destructive' : ''}`}
                              disabled={loading}
                            />
                          </div>
                          {errors.email && (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[11px] text-destructive flex items-center gap-1"
                            >
                              <span className="w-1 h-1 rounded-full bg-destructive" />
                              {errors.email}
                            </motion.p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="password" className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/80 font-medium">
                            Password
                          </Label>
                          <div className="relative group">
                            <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-focus-within:bg-primary/10 transition-colors">
                                <Lock className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              </div>
                            </div>
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={formData.password}
                              onChange={handleInputChange}
                              className={`pl-12 pr-12 h-11 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${errors.password ? 'border-destructive focus:border-destructive' : ''}`}
                              disabled={loading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {errors.password && (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[11px] text-destructive flex items-center gap-1"
                            >
                              <span className="w-1 h-1 rounded-full bg-destructive" />
                              {errors.password}
                            </motion.p>
                          )}
                          {!isLogin && <PasswordStrengthIndicator password={formData.password} />}
                        </div>

                        {isLogin && (
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => setAuthStep("forgot-password")}
                              className="text-xs text-primary/80 hover:text-primary transition-colors hover:underline underline-offset-2"
                            >
                              Forgot password?
                            </button>
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 text-xs tracking-[0.2em] uppercase font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
                          disabled={loading}
                        >
                          <span className="relative z-10">
                            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                          </span>
                          {/* Shine effect */}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </Button>
                      </form>

                      {/* Security badge */}
                      <div className="flex items-center justify-center gap-1.5 mt-5 text-[10px] text-muted-foreground/60">
                        <Shield className="w-3 h-3" />
                        <span>Secure & encrypted connection</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Animated Photo Rows (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 p-4">
          <div className="w-full h-full rounded-3xl relative overflow-hidden flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, hsl(35 25% 92%) 0%, hsl(30 20% 88%) 40%, hsl(25 22% 82%) 70%, hsl(20 25% 78%) 100%)'
            }}
          >
            {/* Gradient overlays for fade effect */}
            <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, hsl(35 25% 92%), transparent)' }}
            />
            <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, hsl(20 25% 78%), transparent)' }}
            />
            
            {/* Row 1 - Moving Left */}
            <div className="w-full overflow-hidden mb-6 group/row1 -rotate-3">
              <div className="flex animate-marquee-left group-hover/row1:[animation-play-state:paused]" style={{ width: 'max-content' }}>
                {row1Images.map((src, i) => (
                  <div 
                    key={i} 
                    className="flex-shrink-0 w-40 h-40 mx-2 rounded-xl overflow-hidden shadow-lg transform rotate-2 hover:rotate-0 hover:scale-110 hover:shadow-xl transition-all duration-300 hover:z-10"
                  >
                    <img src={src} alt="Pottery piece" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Row 2 - Moving Right */}
            <div className="w-full overflow-hidden mb-6 group/row2 rotate-2">
              <div className="flex animate-marquee-right group-hover/row2:[animation-play-state:paused]" style={{ width: 'max-content' }}>
                {row2Images.map((src, i) => (
                  <div 
                    key={i} 
                    className="flex-shrink-0 w-44 h-44 mx-2 rounded-xl overflow-hidden shadow-lg transform -rotate-1 hover:rotate-0 hover:scale-110 hover:shadow-xl transition-all duration-300 hover:z-10"
                  >
                    <img src={src} alt="Pottery piece" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Row 3 - Moving Left (slower) */}
            <div className="w-full overflow-hidden group/row3 -rotate-1">
              <div className="flex group-hover/row3:[animation-play-state:paused]" style={{ width: 'max-content', animation: 'marquee-left 40s linear infinite' }}>
                {row3Images.map((src, i) => (
                  <div 
                    key={i} 
                    className="flex-shrink-0 w-36 h-36 mx-2 rounded-xl overflow-hidden shadow-lg transform rotate-1 hover:rotate-0 hover:scale-110 hover:shadow-xl transition-all duration-300 hover:z-10"
                  >
                    <img src={src} alt="Pottery piece" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
