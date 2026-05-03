import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { StoreDetailsFields } from '@/features/seller/components/StoreDetailsFields';
import { SellerOnboardingFormData } from '../../schemas';

export function StoreStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SellerOnboardingFormData>();

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Set up your storefront</h2>
        <p className="text-muted-foreground mt-2">
          What will customers see when they buy from you?
        </p>
      </div>

      <StoreDetailsFields
        register={register as any}
        errors={errors as any}
        storeName={{
          name: 'displayName',
          id: 'displayName',
          label: 'Store Display Name',
          placeholder: 'e.g. Acme Electronics',
          inputClassName: 'focus:ring-primary/20 h-12 text-lg transition-all focus:ring-2',
        }}
        phone={{
          name: 'phone',
          id: 'phone',
          label: 'Customer Support Phone',
          placeholder: '+91 98765 43210',
          inputClassName: 'h-12 text-lg',
        }}
        description={{
          name: 'description',
          id: 'description',
          label: 'Store Description',
          placeholder: 'Tell the world what makes your products special...',
          inputClassName: 'min-h-30 resize-none p-4 text-base',
        }}
      />
    </motion.div>
  );
}
