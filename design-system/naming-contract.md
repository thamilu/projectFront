# Naming Contract - Card Content & Body Divergence

This document records the intentional naming divergence between the React components API and the CSS tailwind layout layer tokens within the design system.

## Anatomy Class Mapping Matrix

| React Component | CSS Class    | data-slot    | Reason            |
| --------------- | ------------ | ------------ | ----------------- |
| CardContent     | .card-body   | card-content | CSS token anatomy |
| CardHeader      | .card-header | card-header  | Consistent        |
| CardFooter      | .card-footer | card-footer  | Consistent        |

## Rationale

1. **React API Standard**: React developers expect `<CardContent>` to match common library conventions (e.g., Radix, shadcn/ui, Material UI).
2. **CSS Anatomy Standard**: The design system defines layout tokens like `.card-body` to map cleanly with standard DOM anatomy.
3. **Traceability**: The `data-slot="card-content"` attribute bridges the naming gap, allowing automated QA tests and style selectors to reference the component semantic type directly.
