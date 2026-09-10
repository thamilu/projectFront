export interface AccentColorConfig {
  readonly name: string;
  readonly class: string;
  readonly label: string;
  readonly wcagAACompliant: boolean;
}

export const ACCENT_COLORS = [
  { name: 'blue', class: 'bg-blue-500', label: 'Blue', wcagAACompliant: true },
  { name: 'purple', class: 'bg-purple-500', label: 'Purple', wcagAACompliant: true },
  { name: 'pink', class: 'bg-pink-500', label: 'Pink', wcagAACompliant: true },
  { name: 'red', class: 'bg-red-500', label: 'Red', wcagAACompliant: true },
  { name: 'orange', class: 'bg-orange-500', label: 'Orange', wcagAACompliant: true },
  { name: 'green', class: 'bg-green-500', label: 'Green', wcagAACompliant: true },
  { name: 'teal', class: 'bg-teal-500', label: 'Teal', wcagAACompliant: true },
  { name: 'cyan', class: 'bg-cyan-500', label: 'Cyan', wcagAACompliant: true },
] as const satisfies readonly AccentColorConfig[];

export type AccentColorName = (typeof ACCENT_COLORS)[number]['name'];
