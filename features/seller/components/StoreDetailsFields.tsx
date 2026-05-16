import React from 'react';
import { UseFormRegister, FieldErrors, FieldValues, Path, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddressFields } from '@/shared/components/AddressFields';
import { Wand2, Tractor, CheckCircle2, Loader2, XCircle, Store, Phone as PhoneIcon, Globe, Image as ImageIcon, MapPin, FileText } from 'lucide-react';
import { FormError } from '@/components/ui/form-error';
import { SellerBusinessType } from '../types';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/http/services';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { StepInput } from '@/shared/components/StepInput';

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
  const { watch, setValue, setError, clearErrors, formState: { dirtyFields } } = useFormContext();
  const watchedStoreName = watch(storeName.id as string);
  const watchedShopHandle = watch('shopHandle');
  
  const [isCheckingHandle, setIsCheckingHandle] = React.useState(false);
  const [handleStatus, setHandleStatus] = React.useState<'IDLE' | 'AVAILABLE' | 'TAKEN'>('IDLE');

  // Auto-generate handle if it's not manually modified yet
  React.useEffect(() => {
    if (watchedStoreName && !dirtyFields.shopHandle) {
      const generatedHandle = watchedStoreName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('shopHandle' as Path<T>, generatedHandle as any, { shouldValidate: true });
    }
  }, [watchedStoreName, setValue, dirtyFields.shopHandle]);

  // Debounced Handle Availability Check
  React.useEffect(() => {
    if (!watchedShopHandle || watchedShopHandle.length < 3) {
      setHandleStatus('IDLE');
      clearErrors('shopHandle' as any);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsCheckingHandle(true);
      try {
        const response = await apiClient.get(
          `${API_ENDPOINTS.SELLERS.ROOT}/check-handle/${watchedShopHandle}`,
          { signal: controller.signal }
        );
        
        const isAvailable = response.data?.data === true;
        setHandleStatus(isAvailable ? 'AVAILABLE' : 'TAKEN');
        
        if (!isAvailable) {
          setError('shopHandle' as any, { 
            type: 'manual', 
            message: 'This handle is already taken' 
          });
        } else {
          clearErrors('shopHandle' as any);
        }
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') return;
        
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message || 'Handle verification failed';
        
        console.error(`Handle check failed [${status}]:`, message);
        setHandleStatus('IDLE');
        
        // If it's a server error or blocked, we don't want to block the user completely,
        // but we should warn them.
        if (status !== 404) { // 404 might mean the endpoint itself is wrong, but here it shouldn't happen
           // Silently fail or show a subtle warning? 
           // For now, just logging is enough if we reset the status.
        }
      } finally {
        // UX: keep spinner for a brief moment for smoother transition
        setTimeout(() => setIsCheckingHandle(false), 300);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [watchedShopHandle, setError, clearErrors]);

  const getError = (fieldName: string) => {
    return (errors as any)?.[fieldName]?.message;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <StepInput
          id={storeName.id}
          label={storeName.label}
          placeholder={storeName.placeholder}
          {...register(storeName.id as Path<T>)}
          icon={Store}
          error={getError(storeName.id)}
        />

        {phone && (
          <StepInput
            id={phone.id}
            label={phone.label}
            placeholder={phone.placeholder}
            {...register(phone.id as Path<T>)}
            icon={PhoneIcon}
            error={getError(phone.id)}
          />
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="shopHandle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
            Shop Handle (Unique ID)
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary text-muted-foreground">
              <Globe className="h-4 w-4" />
            </div>
            <Input
              id="shopHandle"
              placeholder="my-awesome-shop"
              {...register('shopHandle' as Path<T>)}
              className={`h-11 bg-background/50 border-muted-foreground/20 transition-all shadow-sm pl-10 pr-10 ${
                handleStatus === 'AVAILABLE' ? 'border-green-500/50 focus:border-green-500' : 
                handleStatus === 'TAKEN' ? 'border-red-500/50 focus:border-red-500' : 'focus:border-primary'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isCheckingHandle ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary/60" />
              ) : handleStatus === 'AVAILABLE' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : handleStatus === 'TAKEN' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : !dirtyFields.shopHandle && watchedStoreName ? (
                <Wand2 className="h-4 w-4 text-primary/40" />
              ) : null}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground ml-1">
            Your public URL will be: <span className="text-primary font-mono">eshop.com/shop/{watchedShopHandle || 'handle'}</span>
          </p>
          {getError('shopHandle') && <FormError message={getError('shopHandle')} />}
        </div>

        <StepInput
          id="shopLogoUrl"
          label="Shop Logo URL"
          placeholder="https://..."
          {...register('shopLogoUrl' as Path<T>)}
          icon={ImageIcon}
          error={getError('shopLogoUrl')}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={description.id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary/60" />
          {description.label}
        </Label>
        <Textarea
          id={description.id}
          placeholder={description.placeholder}
          rows={3}
          {...register(description.id as Path<T>)}
          className="bg-background/50 border-muted-foreground/20 focus:border-primary transition-all shadow-sm min-h-[100px] p-4 text-sm"
        />
        {getError(description.id) && <FormError message={getError(description.id)} />}
      </div>

      <div className="pt-4">
        <AddressFields 
          namePrefix="store" 
          title="Store Location" 
          showTitle 
          description=""
        />
      </div>

      {/* Farmer Specific Fields */}
      {useFormContext().watch('businessTypes')?.includes(SellerBusinessType.FARMER) && (
        <div className="p-8 rounded-3xl bg-green-500/5 border border-green-500/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <Tractor className="h-6 w-6" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Farmer Details</h3>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <StepInput
              id="farmLocationVillage"
              label="Farm Location (Village)"
              placeholder="e.g. Rampur"
              {...register('farmLocationVillage' as Path<T>)}
              icon={MapPin}
              error={getError('farmLocationVillage')}
            />

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

      <StepInput
        id="googleMapsUrl"
        label="Google Maps URL (Optional)"
        placeholder="https://goo.gl/maps/..."
        {...register('googleMapsUrl' as Path<T>)}
        icon={MapPin}
        error={getError('googleMapsUrl')}
      />
      <p className="text-[10px] text-muted-foreground italic ml-1 -mt-4">
        Tip: Share your shop location link from Google Maps for easier discovery.
      </p>
    </div>
  );
}
