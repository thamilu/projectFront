import { getKeycloakAccountUrl } from '@/features/auth/services/keycloak-account';

describe('getKeycloakAccountUrl', () => {
  it('builds the Account Console root when no section is given', () => {
    expect(getKeycloakAccountUrl()).toBe('http://localhost:8080/realms/eshop/account/');
  });

  it('builds a deep link into the sessions ("signing-in") section', () => {
    expect(getKeycloakAccountUrl('sessions')).toBe(
      'http://localhost:8080/realms/eshop/account/#/account-security/signing-in'
    );
  });

  it('builds a deep link into the credentials section', () => {
    expect(getKeycloakAccountUrl('credentials')).toBe(
      'http://localhost:8080/realms/eshop/account/#/security/signing-in'
    );
  });
});
