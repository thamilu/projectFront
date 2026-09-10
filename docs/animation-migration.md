# Animation Variants Migration Guide

## Why We Changed

To align the application animations with enterprise-grade and Fortune 500 standards, the flat animation exports inside `animation-variants.ts` have been restructured.
The new architecture introduces:

1. **Namespace Grouping**: Better discoverability, zero import collisions, and clean autocomplete under specific animation profiles (e.g., `PageAnimations`, `StepAnimations`).
2. **Type Safety via satisfies**: Authoring-time validation against Framer Motion's `Variants` and `Transition` interfaces.
3. **DRY Design Tokens**: Timing, easing curves, and spatial offset parameters are centralized into reusable constants (`DURATIONS`, `EASINGS`, `OFFSETS`).
4. **Factory-Driven Creation**: Structural logic is parameterized in clean factories (`createSlideVariants`, `createTransition`), preventing duplicate boilerplate.
5. **Accessibility Compliance**: Built-in OS-level reduced-motion support using the custom `useAnimationConfig` hook, conforming to WCAG 2.2 Success Criterion 2.3.3.

---

## Migration Table

| Deprecated (Remove by Sprint 12) | Modern Namespace API        |
| -------------------------------- | --------------------------- |
| `PAGE_SLIDE_VARIANTS`            | `PageAnimations.variants`   |
| `PAGE_TRANSITION`                | `PageAnimations.transition` |
| `STEP_CONTENT_VARIANTS`          | `StepAnimations.variants`   |
| `STEP_CONTENT_TRANSITION`        | `StepAnimations.transition` |

---

## Code Transition Examples

### Before

```tsx
import { PAGE_SLIDE_VARIANTS, PAGE_TRANSITION } from '@/shared/config/animation-variants';

export function Component() {
  return (
    <motion.div
      variants={PAGE_SLIDE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PAGE_TRANSITION}
    />
  );
}
```

### After (Standard Motion Allowed)

```tsx
import { PageAnimations } from '@/shared/config';

export function Component() {
  return (
    <motion.div
      variants={PageAnimations.variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PageAnimations.transition}
    />
  );
}
```

### After (With Reduced-Motion Accessibility - Recommended)

```tsx
import { PageAnimations } from '@/shared/config';
import { useAnimationConfig } from '@/shared/hooks';

export function Component() {
  const pageAnim = useAnimationConfig(PageAnimations);

  return (
    <motion.div
      variants={pageAnim.variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageAnim.transition}
    />
  );
}
```

---

## Standardizing exit animations with AnimatePresence

Framer Motion exit transitions require elements to mount/unmount inside an `<AnimatePresence>` context with a unique `key` prop that changes when the view/content switches.

Always declare `mode="wait"` to allow exiting content to finish transitioning before entering content mounts.

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { FadeAnimations } from '@/shared/config';
import { useAnimationConfig } from '@/shared/hooks';

export function SwappingComponent({ activeView }) {
  const fade = useAnimationConfig(FadeAnimations);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeView}
        variants={fade.variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={fade.transition}
      >
        {activeView === 'A' ? <ViewA /> : <ViewB />}
      </motion.div>
    </AnimatePresence>
  );
}
```
