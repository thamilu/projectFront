/**
 * Visual + assistive-tech marker for a required form field (WCAG 3.3.2:
 * label or instructions must communicate that input is required). Renders
 * an asterisk for sighted users and "(required)" for screen readers, so
 * requiredness isn't conveyed by the asterisk glyph alone. Pair with
 * `aria-required` on the actual input/select — this only decorates the
 * label.
 */
export function RequiredMark() {
  return (
    <span className="text-destructive ml-1 font-bold" title="This field is required" aria-label="required">
      *<span className="sr-only"> (required)</span>
    </span>
  );
}

export default RequiredMark;
