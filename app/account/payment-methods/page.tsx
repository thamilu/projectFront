'use client';

import { useState } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle2, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  label: string;
  subLabel: string;
  isDefault: boolean;
}

const MOCK_METHODS: PaymentMethod[] = [
  { id: '1', type: 'card', label: 'HDFC Visa ••••4242', subLabel: 'Expires 08/26', isDefault: true },
  { id: '2', type: 'upi', label: 'john@okicici', subLabel: 'UPI ID', isDefault: false },
  { id: '3', type: 'wallet', label: 'Paytm Wallet', subLabel: '₹250 balance', isDefault: false },
];

const TypeIcon = ({ type }: { type: PaymentMethod['type'] }) => {
  if (type === 'card') return <CreditCard className="h-5 w-5 text-blue-600" />;
  if (type === 'upi') return <Smartphone className="h-5 w-5 text-green-600" />;
  return <Wallet className="h-5 w-5 text-purple-600" />;
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>(MOCK_METHODS);

  const handleDelete = (id: string) => {
    setMethods(m => m.filter(pm => pm.id !== id));
    toast.success('Payment method removed');
  };

  const handleSetDefault = (id: string) => {
    setMethods(m => m.map(pm => ({ ...pm, isDefault: pm.id === id })));
    toast.success('Default payment method updated');
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add New</Button>
      </div>

      <div className="space-y-3">
        {methods.map(method => (
          <Card key={method.id} className={method.isDefault ? 'border-primary' : ''}>
            <CardContent className="flex items-center gap-4 pt-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <TypeIcon type={method.type} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{method.label}</p>
                  {method.isDefault && (
                    <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Default
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{method.subLabel}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!method.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>
                    Set Default
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(method.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {methods.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <CreditCard className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>No payment methods saved.</p>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center">
        🔒 Your payment information is encrypted and stored securely.
      </p>
    </div>
  );
}
