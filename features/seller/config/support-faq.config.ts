export interface FaqItemConfig {
  /** Stable unique identifier for the FAQ item (used as React key and analytics tracker). */
  id: string;
  /** Translation key for the FAQ question. */
  questionKey: string;
  /** Translation key for the FAQ answer. */
  answerKey: string;
}

export const FAQS_CONFIG: FaqItemConfig[] = [
  {
    id: 'registration-free',
    questionKey: 'supportFaq.faqs.registrationFree.q',
    answerKey: 'supportFaq.faqs.registrationFree.a',
  },
  {
    id: 'subscription-required',
    questionKey: 'supportFaq.faqs.subscriptionRequired.q',
    answerKey: 'supportFaq.faqs.subscriptionRequired.a',
  },
  {
    id: 'trial-period',
    questionKey: 'supportFaq.faqs.trialPeriod.q',
    answerKey: 'supportFaq.faqs.trialPeriod.a',
  },
  {
    id: 'commissions-charged',
    questionKey: 'supportFaq.faqs.commissionsCharged.q',
    answerKey: 'supportFaq.faqs.commissionsCharged.a',
  },
  {
    id: 'documents-required',
    questionKey: 'supportFaq.faqs.documentsRequired.q',
    answerKey: 'supportFaq.faqs.documentsRequired.a',
  },
  {
    id: 'approval-time',
    questionKey: 'supportFaq.faqs.approvalTime.q',
    answerKey: 'supportFaq.faqs.approvalTime.a',
  },
];
