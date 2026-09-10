import React from 'react';
import { UseFormRegister, FieldErrors, useFormContext } from 'react-hook-form';
import { useI18n } from '@/core/i18n';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { AddressFields } from '@/shared/ui/molecules/AddressFields';
import {
  Wand2,
  Tractor,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
  Store,
  Phone as PhoneIcon,
  Globe,
  Image as ImageIcon,
  MapPin,
  FileText,
} from 'lucide-react';
import { SellerBusinessType } from '../types';
import { Checkbox } from '@/shared/ui/atoms/checkbox';
import { StepInput } from '@/shared/ui/molecules/StepInput';
import { generateShopHandle } from '@/domains/seller/contracts/shop-handle';
import {
  useHandleAvailability,
  type HandleAvailabilityStatus,
} from '@/features/seller/hooks/use-handle-availability';
import type { SellerOnboardingValues } from '@/domains/seller/contracts/seller.schema';

export type StoreStepFormValues = Pick<
  SellerOnboardingValues,
  | 'shopName'
  | 'businessPhone'
  | 'description'
  | 'shopHandle'
  | 'shopLogoUrl'
  | 'farmLocationVillage'
  | 'isOwnProduce'
  | 'googleMapsUrl'
  | 'businessTypes'
  | 'storeAddressLine1'
  | 'storeAddressLine2'
  | 'storeCity'
  | 'storeDistrict'
  | 'storeTaluk'
  | 'storeState'
  | 'storePincode'
  | 'storeCountry'
  // Bank/payout fields are rendered by BankDetailsFields (a sibling
  // component within StoreStep, not StoreDetailsFields itself) but are
  // included here so StoreStep's shared error-announcement/focus-on-error
  // logic — typed against this same StoreStepFormValues — covers them too.
  | 'bankAccountNumber'
  | 'bankAccountNumberConfirm'
  | 'bankIfsc'
>;

interface FieldSpec {
  id: keyof StoreStepFormValues;
  label: string;
  placeholder: string;
}

/**
 * Marks the field error this component owns.
 *
 * React Hook Form gives every error a `type`. Tagging ours means "clear the
 * handle error" can be narrowed to "clear the error *we* set", which is what
 * stops it wiping a schema error — see {@link StoreDetailsFields}.
 */
const HANDLE_TAKEN_ERROR_TYPE = 'handleUnavailable';

/**
 * Shared by the two states that both mean "this handle will not work".
 *
 * One object rather than two identical ones: to a seller `INVALID` and `TAKEN`
 * are the same signal, and the message beneath the field says which. Two copies
 * would be free to drift apart.
 */
const UNUSABLE_HANDLE_STYLE = {
  border: 'border-destructive/50 focus:border-destructive',
  icon: 'text-destructive',
  message: 'text-destructive',
} as const;

/**
 * Presentation for each availability state, declared once.
 *
 * Previously these lived in nested ternaries inside JSX — one chain for the
 * border, another for the icon — which is how a new state could be added with
 * styling in one chain and not the other. A table makes that omission
 * impossible.
 *
 * Colours come from semantic tokens (`success`, `destructive`, `warning`) rather
 * than raw palette values, so the field reacts correctly to the dark,
 * high-contrast and colour-blind themes. The previous hardcoded
 * `border-green-500` / `text-red-500` did not.
 */
const AVAILABILITY_STYLES: Record<
  Exclude<HandleAvailabilityStatus, 'IDLE'>,
  { border: string; icon: string; message: string }
> = {
  AVAILABLE: {
    border: 'border-success/50 focus:border-success',
    icon: 'text-success',
    message: 'text-success',
  },
  TAKEN: UNUSABLE_HANDLE_STYLE,
  INVALID: UNUSABLE_HANDLE_STYLE,
  ERROR: {
    border: 'border-warning/50 focus:border-warning',
    icon: 'text-warning',
    // Not `text-warning` for the sentence itself: that token resolves to
    // amber-500 in the light theme, which at this 10px size sits under the
    // 4.5:1 WCAG 1.4.3 threshold on a light background. Border and icon may use
    // it — non-text contrast is a lower bar and the icon is decorative, with the
    // text below carrying the meaning — but the prose needs the darker step.
    message: 'text-amber-600 dark:text-amber-500',
  },
};

export function StoreDetailsFields(props: {
  register: UseFormRegister<StoreStepFormValues>;
  errors?: FieldErrors<StoreStepFormValues>;
  storeName: FieldSpec;
  description: FieldSpec;
  phone?: FieldSpec;
  email?: FieldSpec;
  disabled?: boolean;
}) {
  const { register, errors, storeName, description, phone, disabled = false } = props;
  const { t } = useI18n();

  const {
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { dirtyFields },
  } = useFormContext<StoreStepFormValues>();

  const watchedStoreName = watch(storeName.id) as string | undefined;
  const watchedShopHandle = watch('shopHandle');
  const businessTypes = watch('businessTypes');
  const isOwnProduce = watch('isOwnProduce');

  /**
   * Suggest a handle until the seller takes ownership of the field.
   *
   * `generateShopHandle` enforces the length cap the inline version omitted: a
   * store name over 50 characters used to produce an over-long handle that
   * failed schema validation *and* crashed the availability check, with the
   * seller having typed nothing wrong.
   */
  React.useEffect(() => {
    if (!watchedStoreName || dirtyFields.shopHandle) return;

    const suggestion = generateShopHandle(watchedStoreName);
    // Skip the write when nothing usable came out, rather than clobbering the
    // field with '' on every keystroke of a name that is still too short.
    if (suggestion) {
      setValue('shopHandle', suggestion, { shouldValidate: true });
    }
  }, [watchedStoreName, setValue, dirtyFields.shopHandle]);

  // All debouncing, aborting, HTTP and error translation lives in the hook; this
  // component only decides how to present the outcome.
  const availability = useHandleAvailability(watchedShopHandle, { enabled: !disabled });

  /**
   * Tracks whether the currently-displayed handle error is ours.
   *
   * [BUG THIS FIXES] The old code called `clearErrors('shopHandle')` on every
   * successful check *and* on every value shorter than three characters. Both
   * wiped whatever error was on the field — including the schema's own
   * "Handle must be at least 3 characters" and "Only lowercase letters, numbers,
   * and hyphens allowed". The minimum-length message could therefore never be
   * seen, and a handle the schema rejected could still be shown with a green
   * "available" tick if the backend happened to consider it free.
   */
  const ownsHandleError = React.useRef(false);

  React.useEffect(() => {
    if (availability.status === 'TAKEN') {
      setError('shopHandle', {
        type: HANDLE_TAKEN_ERROR_TYPE,
        message: availability.message ?? 'This handle is already taken',
      });
      ownsHandleError.current = true;
      return;
    }

    if (ownsHandleError.current) {
      clearErrors('shopHandle');
      ownsHandleError.current = false;
    }
  }, [availability.status, availability.message, setError, clearErrors]);

  const getError = (fieldName: keyof StoreStepFormValues) => {
    return errors?.[fieldName]?.message;
  };

  const handleError = getError('shopHandle');
  const availabilityStyle =
    availability.status === 'IDLE' ? null : AVAILABILITY_STYLES[availability.status];

  /**
   * Live text for the availability state.
   *
   * Every state that has meaning gets words. The coloured border and icon alone
   * would be a WCAG 1.4.1 failure (colour as the sole carrier of information)
   * and would tell a screen-reader user nothing at all.
   *
   * Suppressed while a field error is displayed: the error text already says the
   * same thing, and announcing both is just noise.
   */
  const availabilityMessage = handleError
    ? null
    : availability.status === 'AVAILABLE'
      ? 'Handle is available'
      : availability.status === 'ERROR'
        ? "Couldn't verify availability — you can continue, this will be re-checked when you submit."
        : availability.message;

  // Order matters: the error is the most urgent thing to hear, the hint the
  // least. Screen readers read `aria-describedby` targets in the listed order.
  const handleDescribedBy =
    [
      handleError ? 'shopHandle-error' : null,
      availabilityMessage ? 'shopHandle-availability' : null,
      'shopHandle-hint',
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <StepInput
          id={storeName.id}
          label={storeName.label}
          placeholder={storeName.placeholder}
          {...register(storeName.id)}
          icon={Store}
          error={getError(storeName.id)}
          disabled={disabled}
          // shopName is the one field here the schema genuinely requires
          // (z.string().min(3, ...), no .optional()) — the others in this
          // component (businessPhone, description, shopLogoUrl,
          // farmLocationVillage, googleMapsUrl) are all schema-optional, so
          // marking them required would be dishonest UI.
          required
        />

        {phone && (
          <StepInput
            id={phone.id}
            label={phone.label}
            placeholder={phone.placeholder}
            {...register(phone.id)}
            icon={PhoneIcon}
            error={getError(phone.id)}
            disabled={disabled}
          />
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="shopHandle"
            className="text-muted-foreground ml-1 text-xs font-semibold tracking-wider uppercase"
          >
            {t('sellerOnboarding.store.fields.shopHandle.label')}
          </Label>
          <div className="group relative">
            <div className="group-focus-within:text-primary text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 transition-colors">
              <Globe className="h-4 w-4" aria-hidden="true" />
            </div>
            <Input
              id="shopHandle"
              placeholder={t('sellerOnboarding.store.fields.shopHandle.placeholder')}
              aria-invalid={!!errors?.shopHandle}
              aria-describedby={handleDescribedBy}
              {...register('shopHandle')}
              // Only the caller's `disabled` gates the field. It used to also be
              // disabled mid-check, which stole focus and dropped keystrokes
              // every time the debounce fired — the field became unusable for
              // anyone typing at a normal speed.
              disabled={disabled}
              className={`bg-background/50 border-muted-foreground/20 h-11 pr-10 pl-10 shadow-sm transition-all ${
                availabilityStyle?.border ?? 'focus:border-primary'
              }`}
            />
            <div
              className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5"
              // Decorative: the live region below carries the same information
              // as text, so announcing the icon too would duplicate it.
              aria-hidden="true"
            >
              {availability.isChecking ? (
                <Loader2 className="text-primary/60 h-4 w-4 animate-spin" />
              ) : availability.status === 'AVAILABLE' ? (
                <CheckCircle2 className={`h-4 w-4 ${availabilityStyle?.icon}`} />
              ) : availability.status === 'TAKEN' || availability.status === 'INVALID' ? (
                <XCircle className={`h-4 w-4 ${availabilityStyle?.icon}`} />
              ) : availability.status === 'ERROR' ? (
                <AlertTriangle className={`h-4 w-4 ${availabilityStyle?.icon}`} />
              ) : !dirtyFields.shopHandle && watchedStoreName ? (
                <Wand2 className="text-primary/40 h-4 w-4" />
              ) : null}
            </div>
          </div>

          {/*
            A single persistent live region rather than a conditionally-mounted
            one. Screen readers announce changes to a region that already exists;
            a node that mounts with its text already in place is unreliably
            announced across AT/browser pairs.
          */}
          <p
            id="shopHandle-availability"
            role="status"
            aria-live="polite"
            className={`ml-1 min-h-[1rem] text-[10px] font-semibold ${
              availabilityStyle?.message ?? ''
            }`}
          >
            {availabilityMessage}
          </p>

          <p id="shopHandle-hint" className="text-muted-foreground ml-1 text-[10px]">
            {t('sellerOnboarding.store.fields.shopHandle.hint')}
            <span className="text-primary font-mono">
              eshop.com/shop/{watchedShopHandle || 'handle'}
            </span>
          </p>
          {handleError && (
            <p
              id="shopHandle-error"
              role="alert"
              className="text-destructive text-[10px] font-semibold uppercase mt-1.5 ml-1 animate-in slide-in-from-top-1"
            >
              {handleError}
            </p>
          )}
        </div>

        <StepInput
          id="shopLogoUrl"
          label={t('sellerOnboarding.store.fields.shopLogoUrl.label')}
          placeholder={t('sellerOnboarding.store.fields.shopLogoUrl.placeholder')}
          {...register('shopLogoUrl')}
          icon={ImageIcon}
          error={getError('shopLogoUrl')}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={description.id}
          className="text-muted-foreground ml-1 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
        >
          <FileText className="text-primary/60 h-3.5 w-3.5" aria-hidden="true" />
          {description.label}
        </Label>
        <Textarea
          id={description.id}
          placeholder={description.placeholder}
          aria-invalid={!!errors?.[description.id]}
          aria-describedby={errors?.[description.id] ? `${String(description.id)}-error` : undefined}
          rows={3}
          {...register(description.id)}
          disabled={disabled}
          className="bg-background/50 border-muted-foreground/20 focus:border-primary min-h-[100px] p-4 text-sm shadow-sm transition-all"
        />
        {getError(description.id) && (
          <p id={`${String(description.id)}-error`} role="alert" className="text-destructive text-[10px] font-semibold uppercase mt-1.5 ml-1 animate-in slide-in-from-top-1">
            {getError(description.id)}
          </p>
        )}
      </div>

      <div className="pt-4">
        <AddressFields namePrefix="store" title="Store Location" showTitle disabled={disabled} />
      </div>

      {/* Farmer Specific Fields */}
      {businessTypes?.includes(SellerBusinessType.FARMER) && (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 rounded-3xl border border-green-500/10 bg-green-500/5 p-8 duration-500">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <Tractor className="h-6 w-6" aria-hidden="true" />
            <h3 className="text-sm font-bold tracking-widest uppercase">
              {t('sellerOnboarding.store.fields.farmerDetails.title')}
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <StepInput
              id="farmLocationVillage"
              label={t('sellerOnboarding.store.fields.farmLocationVillage.label')}
              placeholder={t('sellerOnboarding.store.fields.farmLocationVillage.placeholder')}
              {...register('farmLocationVillage')}
              icon={MapPin}
              error={getError('farmLocationVillage')}
              disabled={disabled}
            />

            <div className="flex items-center space-x-3 pt-6 pl-1">
              <Checkbox
                id="isOwnProduce"
                checked={isOwnProduce}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  setValue('isOwnProduce', checked as boolean, { shouldValidate: true })
                }
              />
              <Label
                htmlFor="isOwnProduce"
                className={`text-sm font-medium ${
                  disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {t('sellerOnboarding.store.fields.isOwnProduce.label')}
              </Label>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <StepInput
          id="googleMapsUrl"
          label={t('sellerOnboarding.store.fields.googleMapsUrl.label')}
          placeholder={t('sellerOnboarding.store.fields.googleMapsUrl.placeholder')}
          {...register('googleMapsUrl')}
          icon={MapPin}
          error={getError('googleMapsUrl')}
          disabled={disabled}
        />
        <p className="text-muted-foreground ml-1 text-[10px] italic">
          {t('sellerOnboarding.store.fields.googleMapsUrl.hint')}
        </p>
      </div>
    </div>
  );
}
