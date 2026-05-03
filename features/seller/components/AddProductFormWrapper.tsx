"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const AddProductForm = dynamic(() => import('./AddProductForm'), { ssr: false });

export default function AddProductFormWrapper() {
  return <AddProductForm />;
}
