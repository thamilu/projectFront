**UI & Design: Responsibilities, Locations, and How‑To**

Purpose: centralize where styling, design tokens, layout rules, and UI primitives live and give clear instructions for common design tasks (container width, typography, theming).

- **Global styles & tokens**: [app/globals.css](../../app/globals.css)
  - Theme CSS variables, animations, global scrollbar, base rules. Change colors, radii, spacing tokens here.

- **Tailwind configuration**: [tailwind.config.ts](tailwind.config.ts)
  - Change the `container` breakpoints, add custom screens, plugins, and global utilities.

- **Component primitives (shadcn/ui)**: [components/ui/](../../components/ui/)
  - Buttons, inputs, dialogs, tooltips, badges, etc. All visual primitives live here — change variants and classNames to update the design system.

- **Layout components**: [components/layout/](../../components/layout/)
  - Header, footer, sidebar, mobile nav. These compose pages — change composition/spacing here.

- **App-level layout & providers**: [app/layout.tsx](../../app/layout.tsx) and [app/providers.tsx](../../app/providers.tsx)
  - Where `html`/`body` wrappers, providers (theme, query, auth), and top-level meta are set. Ensure `<meta name="viewport">` appears here for responsive behavior.

- **Feature pages & containers**: pages under [app/](../../app/) — many use a `.container` utility class. Prefer editing Tailwind `container` or `globals.css` for consistent site-wide layout.

- **Design utilities & helpers**: [src/lib/utils.ts](src/lib/utils.ts#L1) (`cn`, formatters) and small helpers used by components.

Quick How‑Tos

- Make the site wider on desktop (preferred): update `container` in [tailwind.config.ts](tailwind.config.ts). Example:
  - In `tailwind.config.ts` set:

    ```js
    module.exports = {
      theme: {
        container: {
          center: true,
          padding: '1rem',
          screens: {
            lg: '1024px',
            xl: '1200px',
            '2xl': '1400px',
          },
        },
      },
    };
    ```

- Quick override (already applied): add `.container { max-width: 1200px }` to [app/globals.css](../../app/globals.css) to immediately widen pages.

- Change color tokens: edit the `--color-*` variables at the top of [app/globals.css](../../app/globals.css). Use the dark block (`@theme dark`) for dark-mode variants.

- Modify a primitive variant (shadcn/button): edit [components/ui/button.tsx](../../components/ui/button.tsx) and adjust `className` generation or token usage.

Testing & verification

- After edits run:

  ```bash
  npm run type-check
  npm run dev
  ```

- Use browser devtools to test at desktop widths (>= 1280px) and verify layout.

Guidance & best practices

- Prefer centralized changes (Tailwind config + tokens) over per-component overrides.
- Keep primitives small and composable — update variants in `components/ui/*` only when you need a design-system change.
- Avoid inline styles; use Tailwind classes or tokens in `globals.css`.
- Use `container` consistently on page wrappers: `<div className="container mx-auto">`.

Next actionable items (suggested)

- Update `tailwind.config.ts` container screens as shown above and remove the quick override in `globals.css` for consistency.
- Create a short `DESIGN_TOKENS.md` documenting each `--color-*` token and intended usage.
- Add a visual test checklist (viewport sizes, contrast, font-sizes) under `docs/` and integrate a nightly visual snapshot job.

Document created: `docs/UI-Design.md`
