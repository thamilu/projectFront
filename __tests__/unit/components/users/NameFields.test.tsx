import { render, screen } from '@testing-library/react';
import { NameFields } from '@/features/users/components/tabs/components/NameFields';
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
      firstName: 'John',
      lastName: 'Doe',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('NameFields Component', () => {
  it('renders fields correctly with default values', () => {
    render(
      <FormWrapper>
        <NameFields />
      </FormWrapper>
    );

    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
    expect(firstNameInput).toBeInTheDocument();
    expect(firstNameInput.value).toBe('John');

    const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
    expect(lastNameInput).toBeInTheDocument();
    expect(lastNameInput.value).toBe('Doe');
  });

  it('disables both inputs when disabled is true', () => {
    render(
      <FormWrapper>
        <NameFields disabled={true} />
      </FormWrapper>
    );

    const firstNameInput = screen.getByLabelText(/first name/i);
    expect(firstNameInput).toBeDisabled();

    const lastNameInput = screen.getByLabelText(/last name/i);
    expect(lastNameInput).toBeDisabled();
  });

  it('respects extra classNames passed to the container', () => {
    render(
      <FormWrapper>
        <NameFields className="custom-name-test-class" />
      </FormWrapper>
    );

    const groupElement = screen.getByRole('group', { name: /full name/i });
    expect(groupElement).toHaveClass('custom-name-test-class');
  });
});
