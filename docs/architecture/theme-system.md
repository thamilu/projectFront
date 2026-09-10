# Theme System Strategy

This document details the configuration and optimization details of the E-Shop theme system.

## Theme Switching Transitions

### Transition Strategy

We intentionally omit the `disableTransitionOnChange` property on the `ThemeProvider` configuration.

- **Default Behavior**: Standard users experience a smooth 300ms ease-in-out transition when toggling between light and dark modes.
- **Accessibility (A11y)**: Users with vestibular conditions or motion sensitivities who have enabled "Reduce Motion" at the OS level are protected.
- **Implementation**: The transition suppression for these users is handled via CSS queries inside the global style system (`themes.css` or `globals.css` using `@media (prefers-reduced-motion: reduce)` rules).

## Flash of Unstyled Content (FOUC) Prevention

To prevent a white flash when users with Dark Mode enabled load the application, we inject a blocking, inline `<script>` in the `<head>` of the root layout (`app/layout.tsx`). This script extracts the preferred theme from `localStorage` (key: `eshop-theme`) or defaults to the device's system setting, immediately writing it to `document.documentElement.classList` before React hydration/rendering begins.
