import React from 'react';
import { UseFormRegister, FieldErrors, FieldValues, Path, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddressFields } from '@/components/shared/AddressFields';
import { Wand2, Tractor, CheckCircle2 } from 'lucide-react';
import { FormError } from '@/components/ui/form-error';
import { SellerBusinessType } from '../types';
import { Checkbox } from '@/components/ui/checkbox';

interface FieldSpec<T> {
  id: string;
  label: string;
  placeholder: string;
}

export function StoreDetailsFields<T extends FieldValues>(props: {
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  storeName: FieldSpec<T>;
  description: FieldSpec<T>;
  phone?: FieldSpec<T>;
  email?: FieldSpec<T>;
}) {
  const { register, errors, storeName, description, phone } = props;
  const { watch, setValue, formState: { dirtyFields } } = useFormContext();

  const watchedStoreName = watch(storeName.id as string);
  const watchedShopHandle = watch('shopHandle');

  // Auto-generate handle if it's not manually modified yet
  React.useEffect(() => {
    if (watchedStoreName && !dirtyFields.shopHandle) {
      const generatedHandle = watchedStoreName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('shopHandle', generatedHandle, { shouldValidate: true });
    }
  }, [watchedStoreName, setValue, dirtyFields.shopHandle]);

  const getError = (fieldName: string) => {
    return (errors as any)?.[fieldName]?.message;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={storeName.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            {storeName.label}
          </Label>
          <Input
            id={storeName.id}
            placeholder={storeName.placeholder}
            {...register(storeName.id as Path<T>)}
            className="h-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
          />
          {getError(storeName.id) && <FormError message={getError(storeName.id)} />}
        </div>

        {phone && (
          <div className="space-y-1.5">
            <Label htmlFor={phone.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              {phone.label}
            </Label>
            <Input
              id={phone.id}
              placeholder={phone.placeholder}
              {...register(phone.id as Path<T>)}
              className="h-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
            />
            {getError(phone.id) && <FormError message={getError(phone.id)} />}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="shopHandle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Shop Handle (Unique ID)
          </Label>
          <div className="relative group">
            <Input
              id="shopHandle"
              placeholder="my-awesome-shop"
              {...register('shopHandle' as Path<T>)}
              className="h-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm pl-4 pr-10"
            />
            {!dirtyFields.shopHandle && watchedStoreName && (
              <div className="absolute right-3 top-2.5 text-primary/40 animate-pulse group-hover:text-primary transition-colors" title="Auto-generating from shop name">
                <Wand2 className="h-4 w-4" />
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground ml-1">
            Your public URL will be: <span className="text-primary font-mono">eshop.com/shop/{(useFormContext().watch('shopHandle') || 'handle')}</span>
          </p>
          {getError('shopHandle') && <FormError message={getError('shopHandle')} />}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shopLogoUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Shop Logo URL
          </Label>
          <Input
            id="shopLogoUrl"
            placeholder="https://..."
            {...register('shopLogoUrl' as Path<T>)}
            className="h-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
          />
          {getError('shopLogoUrl') && <FormError message={getError('shopLogoUrl')} />}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={description.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
          {description.label}
        </Label>
        <Textarea
          id={description.id}
          placeholder={description.placeholder}
          rows={3}
          {...register(description.id as Path<T>)}
          className="bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm min-h-[80px]"
        />
        {getError(description.id) && <FormError message={getError(description.id)} />}
      </div>

      <div className="pt-2">
        <AddressFields 
          namePrefix="store" 
          title="Store Location" 
          showTitle 
          description=""
        />
      </div>

      {/* Farmer Specific Fields */}
      {useFormContext().watch('businessTypes')?.includes(SellerBusinessType.FARMER) && (
        <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <Tractor className="h-5 w-5" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Farmer Details</h3>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="farmLocationVillage" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Farm Location (Village)
              </Label>
              <Input
                id="farmLocationVillage"
                placeholder="e.g. Rampur"
                {...register('farmLocationVillage' as Path<T>)}
                className="h-10 bg-background/50 border-muted-foreground/20 focus:border-green-500 transition-all shadow-sm"
              />
              {getError('farmLocationVillage') && <FormError message={getError('farmLocationVillage')} />}
            </div>

            <div className="flex items-center space-x-3 pt-6 pl-1">
              <Checkbox 
                id="isOwnProduce"
                checked={useFormContext().watch('isOwnProduce')}
                onCheckedChange={(checked) => useFormContext().setValue('isOwnProduce', checked as boolean, { shouldValidate: true })}
              />
              <Label htmlFor="isOwnProduce" className="text-sm font-medium cursor-pointer">
                I am selling my own farm produce
              </Label>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="googleMapsUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
          Google Maps URL (Optional)
        </Label>
        <Input
          id="googleMapsUrl"
          placeholder="https://goo.gl/maps/..."
          {...register('googleMapsUrl' as Path<T>)}
          className="h-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
        />
        {getError('googleMapsUrl') && <FormError message={getError('googleMapsUrl')} />}
        <p className="text-[10px] text-muted-foreground italic ml-1">
          Tip: Share your shop location link from Google Maps for easier discovery.
        </p>
      </div>
    </div>
  );
}
