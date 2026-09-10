import { formatAddressForOrder } from '@/features/addresses/utils/format-address';
import type { AddressDTO } from '@/features/addresses/api/address-api';

function makeAddress(overrides: Partial<AddressDTO> = {}): AddressDTO {
  return {
    id: 'addr-1',
    type: 'Home',
    name: 'Jane Doe',
    line1: '221B Baker Street',
    city: 'Springfield',
    state: 'IL',
    pincode: '62701',
    phone: '555-0100',
    isDefault: true,
    ...overrides,
  };
}

describe('formatAddressForOrder', () => {
  it('flattens a full address into a single readable line', () => {
    const result = formatAddressForOrder(makeAddress());
    expect(result).toBe(
      'Jane Doe | 221B Baker Street | Springfield, IL 62701 | Phone: 555-0100'
    );
  });

  it('includes line2 when present', () => {
    const result = formatAddressForOrder(makeAddress({ line2: 'Apt 4' }));
    expect(result).toContain('221B Baker Street, Apt 4');
  });

  it('omits the phone segment when phone is empty', () => {
    const result = formatAddressForOrder(makeAddress({ phone: '' }));
    expect(result).not.toContain('Phone:');
  });
});
