import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SellerIdentityType } from '@/types';
import { SellerOnboardingFormData } from '../../schemas';

export function KycStep() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<SellerOnboardingFormData>();

  const identityType = watch('identityType');

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Verify Your Identity</h2>
        <p className="text-muted-foreground mt-2">
          <ShieldCheck className="mr-1 inline-block h-4 w-4 text-green-500" />
          We need this to securely verify your seller status.
        </p>
      </div>

      <div className="bg-muted/30 border-border/50 rounded-2xl border p-6">
        {identityType === SellerIdentityType.INDIVIDUAL ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="panNumber" className="text-base">
                PAN Number
              </Label>
              <Input
                id="panNumber"
                placeholder="ABCDE1234F"
                className="h-12 font-mono tracking-wider uppercase"
                aria-invalid={!!errors.panNumber}
                {...register('panNumber', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }
                })}
              />
              {errors.panNumber && <p className="text-destructive text-sm">{errors.panNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhar" className="text-base">
                Aadhaar Number{' '}
                <span className="text-muted-foreground text-sm font-normal">
                  (Optional)
                </span>
              </Label>
              <Input
                id="aadhar"
                placeholder="1234 5678 9012"
                className="h-12 font-mono tracking-widest"
                aria-invalid={!!errors.aadhar}
                {...register('aadhar')}
              />
              {errors.aadhar && (
                <p className="text-destructive text-sm">{errors.aadhar.message}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-base">
                Legal Business Name
              </Label>
              <Input
                id="businessName"
                placeholder="As written on your incorporation documents"
                className="h-12"
                aria-invalid={!!errors.businessName}
                {...register('businessName')}
              />
              {errors.businessName && (
                <p className="text-destructive text-sm">{errors.businessName.message}</p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessPan" className="text-base">
                  Business PAN
                </Label>
                <Input
                  id="businessPan"
                  placeholder="ABCDE1234F"
                  className="h-12 font-mono tracking-wider uppercase"
                  aria-invalid={!!errors.businessPan}
                  {...register('businessPan', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }
                  })}
                />
                {errors.businessPan && (
                  <p className="text-destructive text-sm">{errors.businessPan.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin" className="text-base">
                  GSTIN (Tax ID)
                </Label>
                <Input
                  id="gstin"
                  placeholder="22AAAAA0000A1Z5"
                  className="h-12 font-mono tracking-wider uppercase"
                  aria-invalid={!!errors.gstin}
                  {...register('gstin', {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }
                  })}
                />
                {errors.gstin && (
                  <p className="text-destructive text-sm">{errors.gstin.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
