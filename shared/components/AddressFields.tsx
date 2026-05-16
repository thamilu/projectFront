import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Globe, MapPin, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { useLocations } from '@/features/locations/hooks/use-locations';
import { toast } from 'sonner';

interface AddressFieldsProps {
  namePrefix?: string; // e.g. "store" results in "storeCity", "storeState" etc.
  title?: string;
  description?: string;
  showTitle?: boolean;
  disabled?: boolean;
}

export function AddressFields({ 
  namePrefix = '', 
  title = 'Residential Address',
  description = 'Your primary permanent location for billing and shipping.',
  showTitle = true,
  disabled = false
}: AddressFieldsProps) {
  const { register, formState: { errors }, watch, setValue, trigger } = useFormContext();

  // Helper to get field names with prefix
  const getFieldName = (name: string) => {
    if (!namePrefix) return name;
    return `${namePrefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  };

  const stateField = getFieldName('state');
  const districtField = getFieldName('district');
  const talukField = getFieldName('taluk');
  const pincodeField = getFieldName('pincode');
  const countryField = getFieldName('country');
  const cityField = getFieldName('city');
  const address1Field = getFieldName('addressLine1');
  const address2Field = getFieldName('addressLine2');

  const stateValue = watch(stateField);
  const districtValue = watch(districtField);
  const talukValue = watch(talukField);
  const pincodeValue = watch(pincodeField);
  const countryValue = watch(countryField);
  const cityValue = watch(cityField);

  const { 
    stateOptions, 
    districtOptions, 
    talukOptions,
    pincodeOptions, 
    localityOptions,
    countryOptions,
    pincodeData,
    isIndia,
    isValidPincode,
    hasStates,
    hasDistricts,
    hasTaluks,
    hasPincodes,
    hasLocalities,
    isLoading,
    isLoadingStates,
    isLoadingDistricts,
    isLoadingTaluks,
    isLoadingPincodeData,
    isLoadingPincodeSearch,
    searchedPincodeOptions
  } = useLocations(countryValue, stateValue, districtValue, talukValue, pincodeValue);

  const prevPincodeRef = useRef<string | undefined>(pincodeValue);

  // Pincode-first Auto-fill Logic [HARDEN]
  useEffect(() => {
    const prevPincode = prevPincodeRef.current;
    prevPincodeRef.current = pincodeValue;

    if (isValidPincode && pincodeData && pincodeData.state) {
      if (stateValue !== pincodeData.state) setValue(stateField, pincodeData.state, { shouldDirty: true, shouldValidate: true });
      if (districtValue !== pincodeData.district) setValue(districtField, pincodeData.district, { shouldDirty: true, shouldValidate: true });
      if (pincodeData.taluk && talukValue !== pincodeData.taluk) setValue(talukField, pincodeData.taluk, { shouldDirty: true, shouldValidate: true });
      
      // Auto-fill locality if there's only one unique option [HARDEN]
      if (localityOptions.length === 1 && cityValue !== localityOptions[0].value) {
        setValue(cityField, localityOptions[0].value, { shouldDirty: true, shouldValidate: true });
      }
    } else if (isIndia && (!pincodeValue || pincodeValue.trim() === '')) {
      // [HARDEN] Clear dependent fields ONLY if pincode was manually cleared by the user.
      if (prevPincode && prevPincode.trim() !== '') {
        if (stateValue || districtValue || talukValue || cityValue) {
          setValue(stateField, '', { shouldDirty: true, shouldValidate: true });
          setValue(districtField, '', { shouldDirty: true, shouldValidate: true });
          setValue(talukField, '', { shouldDirty: true, shouldValidate: true });
          setValue(cityField, '', { shouldDirty: true, shouldValidate: true });
        }
      }
    }
  }, [pincodeData, localityOptions.length, localityOptions[0]?.value, isValidPincode, isIndia, pincodeValue, setValue, stateField, districtField, talukField, cityField, stateValue, districtValue, talukValue, cityValue]);

  const getError = (name: string) => {
    return (errors as any)?.[name]?.message;
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
      )}

      <div className="grid gap-3">
        {/* Address Lines */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={address1Field} className="text-xs font-medium text-muted-foreground ml-1">Address Line 1</Label>
            <Input 
              id={address1Field} 
              {...register(address1Field)} 
              placeholder="Street address, Apartment, etc." 
              className="h-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
              disabled={disabled}
            />
            {getError(address1Field) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(address1Field)}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={address2Field} className="text-xs font-medium text-muted-foreground ml-1">Address Line 2 (Optional)</Label>
            <Input 
              id={address2Field} 
              {...register(address2Field)} 
              placeholder="Landmark, Floor, etc." 
              className="h-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Pincode and City (Moved up for Pincode-first flow visibility) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={pincodeField} className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-2">
              Pincode / ZIP
              {(isLoadingPincodeData || isLoadingPincodeSearch) && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </Label>
            <Combobox 
              options={searchedPincodeOptions}
              value={pincodeValue}
              onSelect={(val) => setValue(pincodeField, val as string, { shouldDirty: true, shouldValidate: true })}
              disabled={disabled}
              placeholder="Enter 6-digit Pincode"
              searchPlaceholder="Type pincode..."
              allowCustomValue={true}
              className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm font-mono tracking-widest"
              onSearchChange={(val) => setValue(pincodeField, val, { shouldDirty: true })}
            />
            {getError(pincodeField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(pincodeField)}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={cityField} className="text-xs font-medium text-muted-foreground ml-1">City / Locality</Label>
            {isValidPincode && hasLocalities ? (
              <Combobox 
                options={localityOptions}
                value={cityValue}
                onSelect={(val) => setValue(cityField, val as string, { shouldDirty: true, shouldValidate: true })}
                disabled={disabled}
                placeholder="Select Locality"
                searchPlaceholder="Search locality..."
                allowCustomValue={true}
                className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm"
              />
            ) : (
              <Input 
                id={cityField} 
                {...register(cityField)} 
                placeholder="Your city"
                disabled={disabled} 
                className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm" 
              />
            )}
            {getError(cityField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(cityField)}</p>}
          </div>
        </div>

        {/* Hierarchy: Taluk -> District -> State */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor={talukField} className="text-xs font-medium text-muted-foreground ml-1">Taluk / Tehsil</Label>
            <Combobox 
              options={talukOptions}
              value={talukValue}
              onSelect={(val) => setValue(talukField, val as string, { shouldDirty: true, shouldValidate: true })}
              disabled={disabled || !districtValue || !isIndia}
              loading={isLoadingTaluks}
              placeholder="Select Taluk"
              searchPlaceholder="Search taluk..."
              allowCustomValue={true}
              className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={districtField} className="text-xs font-medium text-muted-foreground ml-1">District</Label>
            <Combobox 
              options={districtOptions}
              value={districtValue}
              onSelect={(val) => {
                setValue(districtField, val as string, { shouldDirty: true, shouldValidate: true });
                setValue(talukField, '', { shouldDirty: true, shouldValidate: true });
              }}
              disabled={disabled || !stateValue || !isIndia}
              loading={isLoadingDistricts}
              placeholder="Select District"
              searchPlaceholder="Search district..."
              allowCustomValue={true}
              className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm"
            />
            {getError(districtField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(districtField)}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={stateField} className="text-xs font-medium text-muted-foreground ml-1">State</Label>
            <Combobox 
              options={stateOptions}
              value={stateValue}
              onSelect={(val) => {
                setValue(stateField, val as string, { shouldDirty: true, shouldValidate: true });
                setValue(districtField, '', { shouldDirty: true, shouldValidate: true });
                setValue(talukField, '', { shouldDirty: true, shouldValidate: true });
              }}
              disabled={disabled || !isIndia}
              loading={isLoadingStates}
              placeholder="Select State"
              searchPlaceholder="Search state..."
              className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm"
            />
            {getError(stateField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(stateField)}</p>}
          </div>
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <Label htmlFor={countryField} className="text-xs font-medium text-muted-foreground ml-1">Country</Label>
          <Select 
            value={countryValue || 'India'} 
            onValueChange={(val) => {
              setValue(countryField, val, { shouldDirty: true, shouldValidate: true });
              setValue(stateField, '', { shouldDirty: true, shouldValidate: true });
              setValue(districtField, '', { shouldDirty: true, shouldValidate: true });
              setValue(talukField, '', { shouldDirty: true, shouldValidate: true });
              setValue(pincodeField, '', { shouldDirty: true, shouldValidate: true });
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-10 bg-background/50 border-muted-foreground/20 pl-9 shadow-sm">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {countryOptions.map(c => (
                <SelectItem key={String(c.value)} value={String(c.value)}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getError(countryField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(countryField)}</p>}
        </div>
      </div>
    </div>
  );
}
