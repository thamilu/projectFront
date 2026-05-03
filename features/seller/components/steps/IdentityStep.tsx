import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Building2, Briefcase } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SellerIdentityType, SellerBusinessType } from '@/types';
import { SellerOnboardingFormData } from '../../schemas';

export function IdentityStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SellerOnboardingFormData>();

  const identityType = watch('identityType');
  const businessTypes = watch('businessTypes') || [];

  const handleBusinessTypeToggle = (type: SellerBusinessType) => {
    if (businessTypes.includes(type)) {
      setValue(
        'businessTypes',
        businessTypes.filter((t: string) => t !== type),
        { shouldValidate: true }
      );
    } else {
      setValue('businessTypes', [...businessTypes, type], { shouldValidate: true });
    }
  };

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">How will you sell?</h2>
        <p className="text-muted-foreground mt-2">
          Let us know about your business structure so we can tailor your experience.
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-base">Identity Type</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            onClick={() =>
              setValue('identityType', SellerIdentityType.INDIVIDUAL, { shouldValidate: true })
            }
            className={`cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 ${
              identityType === SellerIdentityType.INDIVIDUAL
                ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]'
                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`rounded-lg p-3 ${
                  identityType === SellerIdentityType.INDIVIDUAL
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold">Individual Seller</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Selling as an independent person. Requires PAN and Aadhaar.
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() =>
              setValue('identityType', SellerIdentityType.BUSINESS, { shouldValidate: true })
            }
            className={`cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 ${
              identityType === SellerIdentityType.BUSINESS
                ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]'
                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`rounded-lg p-3 ${
                  identityType === SellerIdentityType.BUSINESS
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold">Registered Business</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Selling as a company (LLP, Pvt Ltd, etc). Requires GSTIN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="flex items-baseline justify-between text-base">
          Business Category
          <span className="text-muted-foreground text-xs font-normal">
            (Select all that apply)
          </span>
        </Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.values(SellerBusinessType).map((type) => {
            const isSelected = businessTypes.includes(type);
            return (
              <div
                key={type}
                onClick={() => handleBusinessTypeToggle(type)}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-4 text-center transition-all select-none ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground scale-[1.02] transform shadow-md'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
                }`}
              >
                <Briefcase
                  className={`mb-2 h-5 w-5 ${
                    isSelected ? 'opacity-100' : 'text-muted-foreground opacity-50'
                  }`}
                />
                <span className="text-sm leading-tight font-medium">
                  {type.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
        {errors.businessTypes && (
          <p className="text-destructive animate-in fade-in mt-2 text-sm">
            {errors.businessTypes.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}
