'use client';

import React, { createContext, useState, ReactNode } from 'react';

interface SellerFormUIContextValue {
  isPersonalInfoEditing: boolean;
  setIsPersonalInfoEditing: (editing: boolean) => void;
  isPermanentAddressEditing: boolean;
  setIsPermanentAddressEditing: (editing: boolean) => void;
  mobileVerified: boolean;
  setMobileVerified: (verified: boolean) => void;
}

export const SellerFormUIContext = createContext<SellerFormUIContextValue | undefined>(undefined);

export function SellerFormUIProvider({ children }: { children: ReactNode }) {
  const [isPersonalInfoEditing, setIsPersonalInfoEditing] = useState(false);
  const [isPermanentAddressEditing, setIsPermanentAddressEditing] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  return (
    <SellerFormUIContext.Provider
      value={{
        isPersonalInfoEditing,
        setIsPersonalInfoEditing,
        isPermanentAddressEditing,
        setIsPermanentAddressEditing,
        mobileVerified,
        setMobileVerified,
      }}
    >
      {children}
    </SellerFormUIContext.Provider>
  );
}
