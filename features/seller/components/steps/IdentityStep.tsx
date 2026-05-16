"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { User, Building2, Briefcase, CheckCircle2, Tractor, Warehouse, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SellerIdentityType, SellerBusinessType, SELLER_BUSINESS_TYPE_LABELS } from '@/types';
import { SellerOnboardingValues } from '@/schemas/seller.schema';
import { StepLayout } from '@/shared/components/StepLayout';
import { cn } from '@/lib/utils';

export function IdentityStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SellerOnboardingValues>();

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

  const getCategoryIcon = (type: SellerBusinessType) => {
    switch (type) {
      case SellerBusinessType.FARMER: return Tractor;
      case SellerBusinessType.WHOLESALER: return Warehouse;
      case SellerBusinessType.RETAILER: return ShoppingBag;
      default: return Briefcase;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <StepLayout
      title="Seller Identity"
      description="Choose how you will be identified on our platform."
    >
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >
        {/* Identity Type Selection */}
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { 
              type: SellerIdentityType.INDIVIDUAL, 
              title: "Individual", 
              desc: "Perfect for sole traders, freelancers, or home-based businesses.", 
              icon: User,
              color: "from-blue-500/20 to-indigo-500/20"
            },
            { 
              type: SellerIdentityType.BUSINESS, 
              title: "Business", 
              desc: "Ideal for registered companies, enterprises, or large brands.", 
              icon: Building2,
              color: "from-purple-500/20 to-pink-500/20"
            }
          ].map((item) => {
            const isSelected = identityType === item.type;
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.type}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setValue('identityType', item.type, { shouldValidate: true })}
                className={cn(
                  "relative group cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 overflow-hidden",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-[0_0_40px_rgba(var(--primary),0.15)] ring-1 ring-primary/20" 
                    : "border-border bg-background/50 hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                {/* Background Gradient Effect */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br",
                  item.color
                )} />
                
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "p-3 rounded-xl transition-all duration-500 shadow-sm",
                      isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 rotate-3" : "bg-muted text-muted-foreground group-hover:rotate-6 group-hover:text-primary"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-primary"
                      >
                        <CheckCircle2 className="h-5 w-5 fill-primary text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-bold text-lg transition-colors",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Business Categories Selection */}
        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary/70">Business Categories</span>
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Object.values(SellerBusinessType).map((type) => {
              const isSelected = businessTypes.includes(type);
              const CategoryIcon = getCategoryIcon(type);
              
              return (
                <motion.div
                  key={type}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBusinessTypeToggle(type)}
                  className={cn(
                    "group relative flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 p-6 transition-all duration-300 select-none overflow-hidden text-center",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                      : "border-border bg-background/50 hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  {/* Active highlight bar */}
                  {isSelected && <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />}
                  
                  <div className={cn(
                    "p-4 rounded-2xl transition-all duration-500",
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" 
                      : "bg-muted text-muted-foreground group-hover:text-primary group-hover:scale-110"
                  )}>
                    <CategoryIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider block transition-colors",
                      isSelected ? "text-primary" : "text-foreground/70"
                    )}>
                      {SELLER_BUSINESS_TYPE_LABELS[type]}
                    </span>
                    <p className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {isSelected ? 'Selected Category' : 'Click to select'}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          <AnimatePresence>
            {errors.businessTypes && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[10px] text-destructive font-bold uppercase tracking-[0.2em] text-center"
              >
                {errors.businessTypes.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </StepLayout>
  );
}
