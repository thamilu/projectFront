export interface SharedActions {
  isEditing: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onReset: () => void;
  onSave: () => void;
  onNext: () => void;
  onBack: () => void;
  lastSavedTime?: string;
  /** Display label of the tab `onNext` leads to (e.g. "Address"), so the
   *  action button can read "Continue to Address" instead of a generic
   *  "Next Step" that doesn't say where it goes. Undefined on the last tab. */
  nextTabLabel?: string;
}
