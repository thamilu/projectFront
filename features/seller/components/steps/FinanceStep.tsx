import { useFormContext, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SellerOnboardingFormData } from '../../schemas';

export function FinanceStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SellerOnboardingFormData>();

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Financials & Agreement</h2>
        <p className="text-muted-foreground mt-2">Where should we send your payouts?</p>
      </div>

      <div className="bg-primary/5 border-primary/10 mb-8 rounded-2xl border p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="text-primary h-5 w-5" />
          <h3 className="text-lg font-semibold">Bank Details</h3>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Account Number</Label>
            <Input
              id="bankAccountNumber"
              placeholder="000012345678"
              className="bg-background h-12 font-mono"
              aria-invalid={!!errors.bankAccountNumber}
              {...register('bankAccountNumber')}
            />
            {errors.bankAccountNumber && (
              <p className="text-destructive text-sm">{errors.bankAccountNumber.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankIfsc">IFSC Code</Label>
            <Input
              id="bankIfsc"
              placeholder="SBIN0123456"
              className="bg-background focus:ring-primary/20 h-12 font-mono uppercase"
              aria-invalid={!!errors.bankIfsc}
              {...register('bankIfsc')}
            />
            {errors.bankIfsc && (
              <p className="text-destructive text-sm">{errors.bankIfsc.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-muted/40 border-border/40 flex items-start space-x-3 rounded-xl border p-4">
        <Controller
          name="acceptedTerms"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="acceptedTerms"
              className="mt-1 h-5 w-5 shrink-0"
              checked={field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={!!errors.acceptedTerms}
            />
          )}
        />
        <div className="grid gap-1.5 leading-tight">
          <label htmlFor="acceptedTerms" className="cursor-pointer text-base font-medium">
            I agree to the Seller Terms of Service
          </label>
          <p className="text-muted-foreground text-sm">
            By checking this box, you confirm that the information provided is completely accurate,
            and you agree to our platform policies, commission structures, and privacy practices.
          </p>
          {errors.acceptedTerms && (
            <p className="text-destructive mt-1 text-sm font-medium">
              {errors.acceptedTerms.message}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
