import { render, screen } from '@testing-library/react';
import { PersonalDetailsFields } from '@/features/users/components/tabs/components/PersonalDetailsFields';
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
      gender: '',
      dateOfBirth: '',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('PersonalDetailsFields Component', () => {
  it('renders fields correctly with initial values', () => {
    render(
      <FormWrapper>
        <PersonalDetailsFields />
      </FormWrapper>
    );

    const genderSelect = screen.getByLabelText(/gender/i);
    expect(genderSelect).toBeInTheDocument();

    const dateOfBirthInput = screen.getByPlaceholderText(/dd \/ mm \/ yyyy/i);
    expect(dateOfBirthInput).toBeInTheDocument();
  });

  it('disables inputs when disabled is true', () => {
    render(
      <FormWrapper>
        <PersonalDetailsFields disabled={true} />
      </FormWrapper>
    );

    const genderSelectTrigger = screen.getByRole('combobox', { name: /gender/i });
    expect(genderSelectTrigger).toBeDisabled();

    const dateOfBirthInput = screen.getByPlaceholderText(/dd \/ mm \/ yyyy/i);
    expect(dateOfBirthInput).toBeDisabled();
  });

  it('respects extra classNames passed to the container', () => {
    render(
      <FormWrapper>
        <PersonalDetailsFields className="custom-personal-test-class" />
      </FormWrapper>
    );

    const groupElement = screen.getByRole('group', { name: /personal details/i });
    expect(groupElement).toHaveClass('custom-personal-test-class');
  });
});
