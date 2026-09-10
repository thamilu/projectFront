import { memo } from 'react';
import { NameFields } from './NameFields';
import { ContactFields } from './ContactFields';
import { PersonalDetailsFields } from './PersonalDetailsFields';

interface PersonalFieldsProps {
  /** Disables all fields in sub-sections when true (e.g. in view mode or submitting) */
  disabled?: boolean;
}

export const PersonalFields = memo(function PersonalFields({
  disabled = false,
}: PersonalFieldsProps) {
  return (
    <div className="space-y-8">
      {/* Section 1: Name Details */}
      <section className="space-y-4" aria-labelledby="section-name-heading">
        <div className="space-y-1 select-none">
          <h3 id="section-name-heading" className="text-base font-semibold text-foreground tracking-tight">
            Identity Details
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your official name used for account identification and order receipts.
          </p>
        </div>
        <NameFields disabled={disabled} />
      </section>

      <hr className="border-border/60" />

      {/* Section 2: Contact Information */}
      <section className="space-y-4" aria-labelledby="section-contact-heading">
        <div className="space-y-1 select-none">
          <h3 id="section-contact-heading" className="text-base font-semibold text-foreground tracking-tight">
            Contact Information
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your verified email address and primary telephone contact line.
          </p>
        </div>
        <ContactFields disabled={disabled} />
      </section>

      <hr className="border-border/60" />

      {/* Section 3: Personal Demographics */}
      <section className="space-y-4" aria-labelledby="section-demographics-heading">
        <div className="space-y-1 select-none">
          <h3 id="section-demographics-heading" className="text-base font-semibold text-foreground tracking-tight">
            Personal Demographics
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Optional demographic information used for sizing, age verification, and personalized recommendations.
          </p>
        </div>
        <PersonalDetailsFields disabled={disabled} />
      </section>
    </div>
  );
});

PersonalFields.displayName = 'PersonalFields';
