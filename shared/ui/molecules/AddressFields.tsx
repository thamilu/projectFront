/**
 * Re-export shim for backwards compatibility.
 *
 * The `AddressFields` component has been refactored into modular sub-components
 * under `./address/`. This file preserves the original import path so that all
 * existing consumers continue to work without changes.
 *
 * @see {@link ./address/AddressFields.tsx} for the actual implementation.
 */
export { AddressFields } from './address/AddressFields';
export type { AddressFieldsProps } from './address/address.types';
