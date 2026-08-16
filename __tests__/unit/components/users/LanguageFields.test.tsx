import { render, screen } from '@testing-library/react';
import { LanguageFields } from '@/features/users/components/tabs/components/LanguageFields';
import { FormProvider, useForm } from 'react-hook-form';

// Helper component to wrap with FormProvider
function FormWrapper({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues?: any;
}) {
  const methods = useForm({
    defaultValues: defaultValues || {
      alternatePhone: '',
      preferredLanguage: 'en',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('LanguageFields Component', () => {
  it('renders fields correctly with default values', () => {
    render(
      <FormWrapper>
        <LanguageFields />
      </FormWrapper>
    );

    const alternatePhoneInput = screen.getByLabelText(/alternate phone/i) as HTMLInputElement;
    expect(alternatePhoneInput).toBeInTheDocument();
    expect(alternatePhoneInput.value).toBe('');

    const languageSelect = screen.getByLabelText(/preferred language/i);
    expect(languageSelect).toBeInTheDocument();
  });

  it('renders customized placeholders correctly', () => {
    render(
      <FormWrapper>
        <LanguageFields altPhonePlaceholder="+1 555-0100" />
      </FormWrapper>
    );

    const alternatePhoneInput = screen.getByPlaceholderText('+1 555-0100');
    expect(alternatePhoneInput).toBeInTheDocument();
  });

  it('disables both inputs when disabled is true', () => {
    render(
      <FormWrapper>
        <LanguageFields disabled={true} />
      </FormWrapper>
    );

    const alternatePhoneInput = screen.getByLabelText(/alternate phone/i);
    expect(alternatePhoneInput).toBeDisabled();

    const languageSelectTrigger = screen.getByRole('combobox', { name: /preferred language/i });
    expect(languageSelectTrigger).toBeDisabled();
  });

  it('respects extra classNames passed to the container', () => {
    render(
      <FormWrapper>
        <LanguageFields className="custom-test-class" />
      </FormWrapper>
    );

    // The group covers more than language now (alternate phone, timezone,
    // currency, and locale live here too), hence the broader label.
    const groupElement = screen.getByRole('group', {
      name: /preferences and alternate contact information/i,
    });
    expect(groupElement).toHaveClass('custom-test-class');
  });
});
