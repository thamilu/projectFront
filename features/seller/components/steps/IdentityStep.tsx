'use client';

import React, { useMemo } from 'react';
import { useFormContext, useWatch, FieldError } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  SellerBusinessType,
  SELLER_BUSINESS_TYPE_LABELS,
} from '@/domains/seller/contracts/seller.types';
import { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';
import { StepLayout } from '@/shared/ui/organisms/StepLayout';
import { cn } from '@/shared/utils';
import { useI18n } from '@/core/i18n';
import {
  IDENTITY_TYPE_OPTIONS,
  BUSINESS_TYPE_ICONS,
  DEFAULT_BUSINESS_TYPE_ICON,
} from './IdentityStep.config';

/**
 * IdentityStep Component
 *
 * Implements the seller type selection and optional business categorizations.
 * Built with strict WCAG 2.2 AA accessibility, roving tabindex keyboard navigation,
 * prefers-reduced-motion animation logic, scoped useWatch state queries, and clean design tokens.
 */
export function IdentityStep() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<SellerOnboardingValues>();

  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();

  // Scoped field subscriptions to prevent parent form re-render cascades
  const identityType = useWatch({ control, name: 'identityType' });
  const businessTypes = useWatch({ control, name: 'businessTypes' }) ?? [];

  const handleBusinessTypeToggle = (type: SellerBusinessType) => {
    if (businessTypes.includes(type)) {
      setValue(
        'businessTypes',
        businessTypes.filter((t: SellerBusinessType) => t !== type),
        { shouldValidate: true }
      );
    } else {
      setValue('businessTypes', [...businessTypes, type], { shouldValidate: true });
    }
  };

  const getCategoryIcon = (type: SellerBusinessType) => {
    return BUSINESS_TYPE_ICONS[type] || DEFAULT_BUSINESS_TYPE_ICON;
  };

  // Memoized animation configurations to prevent object reallocation on render
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  }), [shouldReduceMotion]);

  const itemVariants = useMemo(() => ({
    hidden: shouldReduceMotion ? { opacity: 0 } : { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }), [shouldReduceMotion]);

  // Roving keyboard radio selection handler
  const handleIdentityKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    options: typeof IDENTITY_TYPE_OPTIONS
  ) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setValue('identityType', options[index].type, { shouldValidate: true });
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % options.length;
      const targetId = `identity-card-${options[nextIndex].type}`;
      const targetEl = document.getElementById(targetId);
      targetEl?.focus();
      setValue('identityType', options[nextIndex].type, { shouldValidate: true });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + options.length) % options.length;
      const targetId = `identity-card-${options[prevIndex].type}`;
      const targetEl = document.getElementById(targetId);
      targetEl?.focus();
      setValue('identityType', options[prevIndex].type, { shouldValidate: true });
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, type: SellerBusinessType) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleBusinessTypeToggle(type);
    }
  };

  const businessTypesError = errors.businessTypes as FieldError | undefined;

  return (
    <StepLayout
      title={t('sellerOnboarding.identity.title', { defaultValue: 'Seller Identity' })}
      description={t('sellerOnboarding.identity.description', {
        defaultValue: 'Choose how you will be identified on our platform.',
      })}
    >
      {/* Screen Reader and Accessibility Live Announcement Region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {identityType && `Selected identity type: ${identityType}`}
        {businessTypes.length > 0 && `Selected business categories: ${businessTypes.join(', ')}`}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12 max-w-4xl mx-auto"
      >
        {/* Identity Type Selection - Radio Group */}
        <div className="space-y-4">
          <div
            role="radiogroup"
            aria-labelledby="identity-type-heading"
            className="grid gap-6 sm:grid-cols-2"
          >
            <span id="identity-type-heading" className="sr-only">
              Select your seller identity type
            </span>

            {IDENTITY_TYPE_OPTIONS.map((item, index) => {
              const isSelected = identityType === item.type;
              const Icon = item.icon;

              // Roving tabindex: first element gets 0 if nothing selected, otherwise only selected gets 0
              const tabIndex = isSelected
                ? 0
                : !identityType && index === 0
                ? 0
                : -1;

              return (
                <motion.div
                  key={item.type}
                  id={`identity-card-${item.type}`}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={t(item.titleKey, { defaultValue: item.defaultTitle })}
                  tabIndex={tabIndex}
                  variants={itemVariants}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => setValue('identityType', item.type, { shouldValidate: true })}
                  onKeyDown={(e) => handleIdentityKeyDown(e, index, IDENTITY_TYPE_OPTIONS)}
                  className={cn(
                    'group relative cursor-pointer overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-primary/20 shadow-[0_0_40px_hsl(var(--color-primary)/0.15)] ring-1'
                      : 'border-border bg-background/50 hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  {/* Background Gradient Effect */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                      item.colorClass
                    )}
                  />

                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          'rounded-xl p-3 shadow-sm transition-all duration-500',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-primary/30 rotate-3 shadow-lg'
                            : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:rotate-6'
                        )}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={shouldReduceMotion ? {} : { scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-primary"
                        >
                          <CheckCircle2
                            className="fill-primary text-primary-foreground h-5 w-5"
                            aria-hidden="true"
                          />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <h3
                        className={cn(
                          'text-lg font-bold transition-colors',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {t(item.titleKey, { defaultValue: item.defaultTitle })}
                      </h3>
                      <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                        {t(item.descKey, { defaultValue: item.defaultDesc })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {errors.identityType && (
            <p id="identityType-error" role="alert" className="text-destructive text-center text-sm font-semibold mt-2">
              {errors.identityType.message}
            </p>
          )}
        </div>

        {/* Business Categories Selection */}
        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden="true" />
            <span id="business-categories-heading" className="text-primary/70 text-xs font-bold tracking-widest uppercase">
              {t('sellerOnboarding.identity.categoriesHeading', { defaultValue: 'Business Categories' })}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden="true" />
          </div>

          <div
            role="group"
            aria-labelledby="business-categories-heading"
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {Object.values(SellerBusinessType).map((type) => {
              const isSelected = businessTypes.includes(type);
              const CategoryIcon = getCategoryIcon(type);
              const typeLabel = SELLER_BUSINESS_TYPE_LABELS[type] ?? type;

              return (
                <motion.div
                  key={type}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={typeLabel}
                  tabIndex={0}
                  variants={itemVariants}
                  whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => handleBusinessTypeToggle(type)}
                  onKeyDown={(e) => handleCategoryKeyDown(e, type)}
                  className={cn(
                    'group relative flex cursor-pointer flex-col items-center gap-4 overflow-hidden rounded-2xl border-2 p-6 text-center transition-all duration-300 select-none',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-[0_0_40px_hsl(var(--color-primary)/0.15)] ring-1 ring-primary/20'
                      : 'border-border bg-background/50 hover:border-primary/40 hover:bg-muted/40'
                  )}
                >
                  {/* Active highlight bar */}
                  {isSelected && <div className="bg-primary absolute top-0 right-0 left-0 h-1" />}

                  <div
                    className={cn(
                      'rounded-xl p-4 transition-all duration-500',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-primary/30 scale-110 shadow-lg'
                        : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:scale-110'
                    )}
                  >
                    <CategoryIcon className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="space-y-1">
                    <span
                      className={cn(
                        'block text-xs font-bold tracking-wider uppercase transition-colors',
                        isSelected ? 'text-primary' : 'text-foreground/70'
                      )}
                    >
                      {typeLabel}
                    </span>
                    <p
                      className={cn(
                        'text-muted-foreground text-xs transition-opacity duration-200',
                        'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                      )}
                    >
                      {isSelected
                        ? t('sellerOnboarding.identity.selected', { defaultValue: 'Selected Category' })
                        : t('sellerOnboarding.identity.clickToSelect', { defaultValue: 'Tap to select' })}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="text-primary h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {businessTypesError?.message && (
              <motion.p
                id="businessTypes-error"
                role="alert"
                initial={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, y: -10 }}
                className="text-destructive text-center text-xs font-bold tracking-wider uppercase"
              >
                {businessTypesError.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </StepLayout>
  );
}
