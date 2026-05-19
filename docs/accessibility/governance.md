# Accessibility (a11y) Governance Standards

E-Shop is committed to providing a digital storefront accessible to everyone. We target strict conformance with the **W3C Web Content Accessibility Guidelines (WCAG) 2.1 AA** standards.

---

## 🎹 Keyboard Navigation Rules

1. **Focus Ring Indication**: Every interactive element (links, buttons, inputs) must display a clear, high-contrast focus ring when focused using a keyboard. Never use `outline: none` without providing a compliant custom focus indicator.
2. **Tab Index Hierarchy**: Keep standard document tab flow natural. Do not inject positive `tabindex` attributes (e.g. `tabindex="1"`), which disrupt natural screen-reader flows.
3. **Modal Focus Traps**: Every interactive modal or sliding drawer must implement a strict **focus trap** that restricts tabbing to elements inside the active container. On exit, keyboard focus must return to the original trigger element.

---

## 🗣️ ARIA Roles and Labels

1. **Alt Attributes**: Every image must provide descriptive `alt` text. Decorative graphics must be set to `alt=""` or `aria-hidden="true"`.
2. **Dynamic Updates**: Real-time alerts, stock status updates, and notification changes must utilize standard live regions (`aria-live="polite"` or `role="alert"`).
3. **Form Association**: All inputs must be explicitly associated with a `<label>` element using `id` and `htmlFor` properties.

---

## 🤖 Automated CI Testing

To protect against regression:
* Run local `axe-core` engines within our Jest/React testing library setups.
* Ensure all high-volume presentation elements (catalog, checkout, profile) pass strict Lighthouse and Wave audits prior to deployment.
