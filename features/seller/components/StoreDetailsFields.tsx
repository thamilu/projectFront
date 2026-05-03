import React from 'react';
import { UseFormRegister, FieldErrors, FieldValues, Path, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddressFields } from '@/components/shared/AddressFields';
import { FormError } from '@/components/ui/form-error';

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
