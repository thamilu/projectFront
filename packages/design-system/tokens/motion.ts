/**
 * Enterprise Design Tokens: Motion
 */
export const motion = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    interactive: '200ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  transition: {
    all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 200ms, background-color 200ms, border-color 200ms, text-decoration-color 200ms, fill 200ms, stroke 200ms',
    opacity: 'opacity 200ms ease-in-out',
    shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  }
} as const;
