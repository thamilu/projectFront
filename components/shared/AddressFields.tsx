import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Globe, MapPin } from 'lucide-react';
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
import { useLocations } from '@/hooks/use-locations';

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
  const { register, formState: { errors }, watch, setValue } = useFormContext();

  // Helper to get field names with prefix
  const getFieldName = (name: string) => {
    if (!namePrefix) return name;
    // camelCase: prefix + Capitalized name
    return `${namePrefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  };

  const stateField = getFieldName('state');
  const districtField = getFieldName('district');
  const pincodeField = getFieldName('pincode');
  const countryField = getFieldName('country');
  const cityField = getFieldName('city');
  const address1Field = getFieldName('addressLine1');
  const address2Field = getFieldName('addressLine2');

  const stateValue = watch(stateField);
  const districtValue = watch(districtField);
  const pincodeValue = watch(pincodeField);
  const countryValue = watch(countryField);

  const { 
    stateOptions, 
    districtOptions, 
    pincodeOptions, 
    countryOptions,
    isIndia,
    hasStates,
    hasDistricts,
    hasPincodes 
  } = useLocations(countryValue, stateValue, districtValue);

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={cityField} className="text-xs font-medium text-muted-foreground ml-1">City</Label>
            <Input id={cityField} {...register(cityField)} disabled={disabled} className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm" />
            {getError(cityField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(cityField)}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={stateField} className="text-xs font-medium text-muted-foreground ml-1">State / Province</Label>
            <Combobox 
              options={stateOptions}
              value={stateValue}
              onSelect={(val) => {
                setValue(stateField, val as string, { shouldDirty: true, shouldValidate: true });
                setValue(districtField, '', { shouldDirty: true, shouldValidate: true });
                setValue(pincodeField, '', { shouldDirty: true, shouldValidate: true });
              }}
              disabled={disabled || !isIndia || !hasStates}
              placeholder={isIndia ? "Select State" : "Only India supported currently"}
              searchPlaceholder="Search state..."
              className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm"
            />
            {getError(stateField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(stateField)}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={districtField} className="text-xs font-medium text-muted-foreground ml-1">District</Label>
            <Combobox 
              options={districtOptions}
              value={districtValue}
              onSelect={(val) => {
                setValue(districtField, val as string, { shouldDirty: true, shouldValidate: true });
                setValue(pincodeField, '', { shouldDirty: true, shouldValidate: true });
              }}
              disabled={disabled || !stateValue || !isIndia}
              placeholder={stateValue ? "Select District" : "Select State First"}
              searchPlaceholder="Search district..."
              allowCustomValue={true}
              className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm"
            />
            {getError(districtField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(districtField)}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={pincodeField} className="text-xs font-medium text-muted-foreground ml-1">Pincode / ZIP</Label>
            <Combobox 
              options={pincodeOptions}
              value={pincodeValue}
              onSelect={(val) => setValue(pincodeField, val as string, { shouldDirty: true, shouldValidate: true })}
              disabled={disabled || !districtValue || !isIndia}
              placeholder={districtValue ? "Select Pincode" : "Select District First"}
              searchPlaceholder="Search pincode..."
              allowCustomValue={true}
              className="h-10 bg-background/50 border-muted-foreground/20 shadow-sm"
            />
            {getError(pincodeField) && <p className="text-[10px] text-destructive font-medium ml-1 uppercase">{getError(pincodeField)}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={countryField} className="text-xs font-medium text-muted-foreground ml-1">Country</Label>
          <Select 
            value={countryValue || 'India'} 
            onValueChange={(val) => {
              setValue(countryField, val, { shouldDirty: true, shouldValidate: true });
              setValue(stateField, '', { shouldDirty: true, shouldValidate: true });
              setValue(districtField, '', { shouldDirty: true, shouldValidate: true });
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
