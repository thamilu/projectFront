import React from 'react';
import { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
      <div className="space-y-2">
        <Label htmlFor={storeName.id}>{storeName.label}</Label>
        <Input
          id={storeName.id}
          placeholder={storeName.placeholder}
          {...register(storeName.id as Path<T>)}
        />
        {getError(storeName.id) && <FormError message={getError(storeName.id)} />}
      </div>

      <div className="space-y-2">
        <Label htmlFor={description.id}>{description.label}</Label>
        <Textarea
          id={description.id}
          placeholder={description.placeholder}
          rows={3}
          {...register(description.id as Path<T>)}
        />
        {getError(description.id) && <FormError message={getError(description.id)} />}
      </div>

      {/* ─── Shop / Warehouse Address Section ─── */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Shop / Warehouse Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="storeAddressLine1">Street Address</Label>
            <Input
              id="storeAddressLine1"
              placeholder="Building, Street, Area"
              {...register('storeAddressLine1' as Path<T>)}
            />
            {getError('storeAddressLine1') && <FormError message={getError('storeAddressLine1')} />}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="storeAddressLine2">Landmark / Area (Optional)</Label>
            <Input
              id="storeAddressLine2"
              placeholder="Near XYZ Landmark"
              {...register('storeAddressLine2' as Path<T>)}
            />
            {getError('storeAddressLine2') && <FormError message={getError('storeAddressLine2')} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeCity">City</Label>
            <Input
              id="storeCity"
              placeholder="City"
              {...register('storeCity' as Path<T>)}
            />
            {getError('storeCity') && <FormError message={getError('storeCity')} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDistrict">District</Label>
            <Input
              id="storeDistrict"
              placeholder="District"
              {...register('storeDistrict' as Path<T>)}
            />
            {getError('storeDistrict') && <FormError message={getError('storeDistrict')} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeState">State</Label>
            <Input
              id="storeState"
              placeholder="State"
              {...register('storeState' as Path<T>)}
            />
            {getError('storeState') && <FormError message={getError('storeState')} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="storePincode">Pincode</Label>
            <Input
              id="storePincode"
              placeholder="6-digit Pincode"
              {...register('storePincode' as Path<T>)}
            />
            {getError('storePincode') && <FormError message={getError('storePincode')} />}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="googleMapsUrl">Google Maps Location URL (Optional)</Label>
            <Input
              id="googleMapsUrl"
              placeholder="https://goo.gl/maps/..."
              {...register('googleMapsUrl' as Path<T>)}
            />
            {getError('googleMapsUrl') && <FormError message={getError('googleMapsUrl')} />}
            <p className="text-xs text-muted-foreground mt-1">
              Tip: Go to Google Maps, find your shop, click Share, and copy the link.
            </p>
          </div>
        </div>
      </div>

      {phone && (
        <div className="space-y-2">
          <Label htmlFor={phone.id}>{phone.label}</Label>
          <Input
            id={phone.id}
            placeholder={phone.placeholder}
            {...register(phone.id as Path<T>)}
          />
          {getError(phone.id) && <FormError message={getError(phone.id)} />}
        </div>
      )}
    </div>
  );
}
