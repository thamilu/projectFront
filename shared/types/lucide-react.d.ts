import type {
  ForwardRefExoticComponent,
  RefAttributes,
  SVGProps,
  CSSProperties,
  Ref,
  // ComponentType is not used but kept for reference
  // ComponentType,
} from 'react';

// Project-level improved typings for `lucide-react` to avoid editing node_modules
declare module 'lucide-react' {
  // ============================================
  // DEFAULT ATTRIBUTES
  // ============================================
  export const defaultAttributes: Readonly<{
    xmlns: 'http://www.w3.org/2000/svg';
    width: 24;
    height: 24;
    viewBox: '0 0 24 24';
    fill: 'none';
    stroke: 'currentColor';
    strokeWidth: 2;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
  }>;

  // ============================================
  // SVG ELEMENT TYPES
  // ============================================
  export type SVGElementName =
    | 'svg'
    | 'g'
    | 'defs'
    | 'symbol'
    | 'use'
    | 'path'
    | 'circle'
    | 'rect'
    | 'line'
    | 'polyline'
    | 'polygon'
    | 'ellipse'
    | 'text'
    | 'tspan'
    | 'textPath'
    | 'linearGradient'
    | 'radialGradient'
    | 'stop'
    | 'clipPath'
    | 'mask'
    | 'filter'
    | 'feBlend'
    | 'feColorMatrix'
    | 'feGaussianBlur'
    | 'feOffset'
    | 'feMerge'
    | 'feMergeNode'
    | 'image'
    | 'foreignObject'
    | 'marker'
    | 'pattern'
    | 'title'
    | 'desc'
    | 'metadata';

  // Attribute value types for icon nodes
  export type SVGAttributeValue = string | number | boolean | null | undefined;

  // Single icon node element (tuple)
  export type IconNodeElement = readonly [
    elementName: SVGElementName,
    attributes: Readonly<Record<string, SVGAttributeValue>>,
    children?: IconNode
  ];

  // Complete icon node structure
  export type IconNode = readonly IconNodeElement[];

  // Type guard to validate IconNode at runtime (useful for factory helpers)
  export function isIconNode(value: unknown): value is IconNode;

  // ============================================
  // SIZE & PRESETS
  // ============================================
  export type IconSizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  export type IconSize = IconSizePreset | number | `${number}px` | `${number}rem`;
  export const sizePresets: Readonly<Record<IconSizePreset, number>>;

  // ============================================
  // PROPS
  // ============================================
  export interface LucideCoreProps {
    size?: IconSize;
    color?: string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
  }

  export interface LucideA11yProps {
    'aria-label'?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
    role?: 'img' | 'presentation' | 'graphics-symbol' | 'graphics-document';
    focusable?: boolean | 'true' | 'false';
    title?: string;
  }

  export interface LucideAnimationProps {
    animate?: boolean;
    animationDuration?: number;
    animationType?: 'spin' | 'pulse' | 'bounce';
  }

  export interface LucideProps
    extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'color'>,
      LucideCoreProps,
      LucideA11yProps,
      Partial<LucideAnimationProps> {
    ref?: Ref<SVGSVGElement>;
    className?: string;
    style?: CSSProperties;
    'data-testid'?: string;
  }

  // ============================================
  // COMPONENT TYPE
  // ============================================
  export type LucideIcon = ForwardRefExoticComponent<
    LucideProps & RefAttributes<SVGSVGElement>
  > & { displayName?: string };

  export interface IconProps extends LucideProps {
    icon: LucideIcon | keyof typeof icons;
    fallback?: LucideIcon;
  }

  // ============================================
  // FACTORY & UTILITIES
  // ============================================
  export function createLucideIcon(iconName: string, iconNode: IconNode): LucideIcon;

  export const icons: Readonly<Record<string, LucideIcon>>;
  export type IconName = keyof typeof icons;

  export function isLucideIcon(value: unknown): value is LucideIcon;

  export function getIcon(name: string, fallback?: LucideIcon): LucideIcon | undefined;

  // Dynamic loader (optional) — mark as possibly undefined in some runtime builds
  export const dynamicIconLoader: ((iconName: string) => Promise<LucideIcon | undefined>) | undefined;

  // ============================================
  // COMMON ICON EXPORTS (for DX / autocomplete)
  // ============================================
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const Info: LucideIcon;
  export const HelpCircle: LucideIcon;

  export const Plus: LucideIcon;
  export const Minus: LucideIcon;
  export const X: LucideIcon;
  export const Check: LucideIcon;
  export const Edit: LucideIcon;
  export const Trash: LucideIcon;
  export const Trash2: LucideIcon;
  export const Copy: LucideIcon;
  export const Save: LucideIcon;

  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Menu: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const MoreVertical: LucideIcon;

  export const Play: LucideIcon;
  export const Pause: LucideIcon;
  export const Image: LucideIcon;

  export const File: LucideIcon;
  export const Folder: LucideIcon;
  export const Archive: LucideIcon;

  export const Search: LucideIcon;
  export const Filter: LucideIcon;
  export const Settings: LucideIcon;

  export const User: LucideIcon;
  export const Users: LucideIcon;

  export default icons;
}
