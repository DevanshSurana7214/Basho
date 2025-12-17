import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

export const validatePassword = (password: string): boolean => {
  return requirements.every((req) => req.test(password));
};

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  if (!password) return null;

  const passedCount = requirements.filter((req) => req.test(password)).length;
  const strengthPercent = (passedCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strengthPercent <= 25) return "bg-destructive";
    if (strengthPercent <= 50) return "bg-orange-500";
    if (strengthPercent <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>
      <ul className="space-y-1">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <li
              key={index}
              className={`flex items-center gap-2 text-xs ${
                passed ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {passed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
