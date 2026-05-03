# Button Component - Usage Examples

## Overview
Enterprise-grade Button component with loading states, accessibility enforcement, and responsive touch targets.

## Features
- ✅ Default `type="button"` prevents accidental form submissions
- ✅ WCAG-compliant touch targets (min 44px for icon buttons, 40px for all buttons)
- ✅ Loading state with spinner and `aria-busy`
- ✅ TypeScript enforcement: icon buttons require `aria-label`
- ✅ Responsive icon sizing per button size
- ✅ Mobile-optimized with active state feedback
- ✅ `fullWidth` variant for mobile CTAs

## Basic Usage

```tsx
import { Button } from '@/components/ui/button';

// Standard button (defaults to type="button")
<Button>Click me</Button>

// Submit button in form
<Button type="submit">Submit Form</Button>

// With variant
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Skip</Button>
```

## Loading State

```tsx
const [isLoading, setIsLoading] = useState(false);

// Async action button
<Button 
  loading={isLoading}
  onClick={async () => {
    setIsLoading(true);
    await addToCart(product);
    setIsLoading(false);
  }}
>
  Add to Cart
</Button>

// Automatically disables button and shows spinner
// Sets aria-busy="true" for screen readers
```

## Icon Buttons (Accessibility Enforced)

```tsx
// ✅ CORRECT - aria-label required by TypeScript
<Button 
  size="icon" 
  aria-label="Delete item"
>
  <Trash className="h-5 w-5" />
</Button>

// ❌ COMPILE ERROR - missing aria-label
<Button size="icon">
  <Trash className="h-5 w-5" />
</Button>
```

## Size Variants

```tsx
// Small button (40px height, 14px icon)
<Button size="sm">Small</Button>

// Default (40px height, 16px icon)
<Button>Default</Button>

// Large (48px height, 20px icon)
<Button size="lg">Large CTA</Button>

// Icon only (44px × 44px, 20px icon)
<Button size="icon" aria-label="Settings">
  <Settings />
</Button>
```

## Full Width (Mobile CTAs)

```tsx
// Mobile checkout button
<Button fullWidth size="lg">
  Proceed to Checkout
</Button>

// Responsive: full width on mobile, auto on desktop
<Button fullWidth className="sm:w-auto">
  Add to Cart
</Button>
```

## E-commerce Examples

### Add to Cart Button
```tsx
<Button
  loading={isAddingToCart}
  disabled={!product.inStock}
  onClick={handleAddToCart}
>
  <ShoppingCart className="mr-2 h-4 w-4" />
  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
</Button>
```

### Checkout Button
```tsx
<Button 
  fullWidth 
  size="lg" 
  type="submit"
  loading={isProcessing}
>
  Complete Purchase • ${total.toFixed(2)}
</Button>
```

### Product Actions Row
```tsx
<div className="flex gap-2">
  <Button fullWidth loading={isAddingToCart}>
    Add to Cart
  </Button>
  <Button 
    size="icon" 
    variant="outline"
    aria-label="Add to wishlist"
  >
    <Heart />
  </Button>
  <Button 
    size="icon" 
    variant="outline"
    aria-label="Share product"
  >
    <Share2 />
  </Button>
</div>
```

### View Mode Toggle
```tsx
<div className="flex gap-2">
  <Button
    variant={viewMode === 'grid' ? 'default' : 'outline'}
    size="icon"
    onClick={() => setViewMode('grid')}
    aria-label="Switch to grid view"
  >
    <Grid />
  </Button>
  <Button
    variant={viewMode === 'list' ? 'default' : 'outline'}
    size="icon"
    onClick={() => setViewMode('list')}
    aria-label="Switch to list view"
  >
    <List />
  </Button>
</div>
```

## Polymorphic Composition (asChild)

```tsx
import Link from 'next/link';

// Render as Next.js Link
<Button asChild>
  <Link href="/products">Browse Products</Link>
</Button>

// Note: when asChild=true, type is not passed through
// The child component controls its own type attribute
```

## Accessibility Notes

1. **Icon Buttons**: TypeScript enforces `aria-label` when `size="icon"` to ensure screen reader users know the button's purpose.

2. **Loading State**: When `loading={true}`:
   - Button is automatically disabled
   - `aria-busy="true"` is set
   - Spinner is shown before children

3. **Touch Targets**: All buttons meet WCAG 2.1 AA minimum touch target requirements:
   - Standard buttons: 40px height
   - Icon buttons: 44px × 44px
   - Large buttons: 48px height

4. **Focus Management**: Visible focus ring with `focus-visible:ring-2` for keyboard navigation.

5. **Active Feedback**: Mobile users get tactile feedback with `active:scale-[0.98]` on tap.

## Performance

- **Stateless**: Component doesn't maintain internal state, no re-render concerns
- **Tree-shakeable**: CVA ensures unused variants aren't bundled
- **Minimal bundle**: ~2KB gzipped including all variants

## Migration from Old Version

### Breaking Changes
1. Icon buttons now require `aria-label` (compile-time error if missing)
2. Touch targets increased: `sm` is now 40px (was 36px), `icon` is now 44px (was 40px)
3. Icons now scale per size variant (different from fixed `size-4`)

### New Features
- `loading` prop with automatic spinner
- `fullWidth` variant
- `type="button"` default (prevents form submission bugs)
- Better mobile active state

### Example Migration
```tsx
// Before
<Button size="icon">
  <Trash />
</Button>

// After (add aria-label)
<Button size="icon" aria-label="Delete">
  <Trash />
</Button>
```

## Testing Examples

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('shows loading spinner', () => {
  render(<Button loading>Submit</Button>);
  expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('button')).toBeDisabled();
});

test('icon button has accessible name', () => {
  render(
    <Button size="icon" aria-label="Delete item">
      <Trash />
    </Button>
  );
  expect(screen.getByRole('button', { name: 'Delete item' })).toBeInTheDocument();
});
```
