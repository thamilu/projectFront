"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CheckoutSchema, { CheckoutFormValues } from '@/lib/validation/checkout';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Smartphone, 
  Wallet,
  Calculator,
  Shield,
  ArrowLeft,
  MapPin,
  Clock
} from 'lucide-react';

// Mock order summary
const orderSummary = {
  items: [
    { name: 'Wireless Headphones', quantity: 2, price: 99.99 },
    { name: 'Smart Watch', quantity: 1, price: 299.99 }
  ],
  subtotal: 499.97,
  shipping: 0,
  tax: 39.98,
  total: 539.95
};

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, MasterCard, American Express'
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: Smartphone,
    description: 'PhonePe, Google Pay, Paytm'
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    icon: Wallet,
    description: 'Amazon Pay, PayPal'
  },
  {
    id: 'emi',
    name: 'EMI Options',
    icon: Calculator,
    description: 'No Cost EMI available'
  }
];

export default function CheckoutPage() {
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'upi' | 'wallet' | 'emi'>('card');

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<CheckoutFormValues>({
    // zodResolver typing may be incompatible with some inferred union/optional shapes;
    // cast to `any` to satisfy the Resolver signature while keeping runtime validation.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CheckoutSchema) as any,
    defaultValues: {
      shipping: {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
      },
      billingSameAsShipping: true,
      paymentMethod: 'card',
      acceptTerms: false,
    },
  });

  const sameAsShipping = watch('billingSameAsShipping');
  const watchPayment = watch('paymentMethod');
  const shippingAddress = watch('shipping') as CheckoutFormValues['shipping'];

  const onSubmit = async (_data: CheckoutFormValues) => {
    try {
      // TODO: call order submit API (server-side) with proper tokenization for card
      // Order submission logic
    } catch (__err) {
      // Checkout submit error
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back to Cart */}
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Checkout Form */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Checkout</h1>
              <p className="text-muted-foreground">Complete your purchase securely</p>
            </div>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="font-medium">John Doe</div>
                  <div className="text-sm text-muted-foreground">
                    {shippingAddress?.street}<br />
                    {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postalCode}<br />
                    {shippingAddress?.country}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Address
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        role="button"
                        tabIndex={0}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          watchPayment === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => {
                          // set controlled field
                          (document.querySelector('input[name="paymentMethod"]') as HTMLInputElement | null)?.setAttribute('value', method.id);
                          setSelectedPayment(method.id as 'card' | 'upi' | 'wallet' | 'emi');
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <method.icon className="h-5 w-5" />
                          <span className="font-medium">{method.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Card Payment Form */}
                  {watchPayment === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input id="cardName" placeholder="John Doe" {...register('card.name' as const)} />
                        {errors.card?.name && <p className="text-sm text-red-500">{errors.card.name.message}</p>}
                      </div>

                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" {...register('card.number' as const)} />
                        {errors.card?.number && <p className="text-sm text-red-500">{errors.card.number.message}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" {...register('card.expiry' as const)} />
                          {errors.card?.expiry && <p className="text-sm text-red-500">{errors.card.expiry.message}</p>}
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" {...register('card.cvc' as const)} />
                          {errors.card?.cvc && <p className="text-sm text-red-500">{errors.card.cvc.message}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  <input type="hidden" {...register('paymentMethod' as const)} />

                  <div className="flex items-center gap-2 mt-4">
                    <input id="acceptTerms" type="checkbox" {...register('acceptTerms' as const)} />
                    <Label htmlFor="acceptTerms" className="text-sm">I agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a></Label>
                  </div>

                  <div className="mt-4">
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? 'Processing...' : `Pay $${orderSummary.total.toFixed(2)}`}
                    </Button>
                  </div>
                </form>

                {/* UPI Payment */}
                {selectedPayment === 'upi' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@paytm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <span className="text-blue-600 font-semibold">PhonePe</span>
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <span className="text-green-600 font-semibold">Google Pay</span>
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <span className="text-blue-500 font-semibold">Paytm</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* EMI Options */}
                {selectedPayment === 'emi' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
                        <div className="font-medium">3 Months</div>
                        <div className="text-sm text-muted-foreground">$179.98/month</div>
                        <div className="text-xs text-green-600">No Cost EMI</div>
                      </div>
                      <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
                        <div className="font-medium">6 Months</div>
                        <div className="text-sm text-muted-foreground">$89.99/month</div>
                        <div className="text-xs text-green-600">No Cost EMI</div>
                      </div>
                      <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
                        <div className="font-medium">12 Months</div>
                        <div className="text-sm text-muted-foreground">$44.99/month</div>
                        <div className="text-xs text-orange-600">2.5% Interest</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Controller
                    control={control}
                    name="billingSameAsShipping"
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="sameAsShipping"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="rounded"
                      />
                    )}
                  />
                  <Label htmlFor="sameAsShipping" className="text-sm">Same as shipping address</Label>
                </div>

                {!sameAsShipping && (
                  <div className="space-y-4">
                    <Input placeholder="Street Address" {...register('billing.street' as const)} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="City" {...register('billing.city' as const)} />
                      <Input placeholder="State" {...register('billing.state' as const)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Postal Code" {...register('billing.postalCode' as const)} />
                      <Input placeholder="Country" {...register('billing.country' as const)} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderSummary.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <hr />
                
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${orderSummary.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">FREE</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${orderSummary.tax.toFixed(2)}</span>
                </div>
                
                <hr />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${orderSummary.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Expected Delivery</div>
                    <div className="text-sm text-muted-foreground">
                      3-5 business days
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Your order will be processed within 24 hours
                </div>
              </CardContent>
            </Card>

            {/* Security Badge */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">Secure Checkout</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• SSL encrypted payment</div>
                  <div>• PCI DSS compliant</div>
                  <div>• Money-back guarantee</div>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button className="w-full" size="lg">
              Place Order - ${orderSummary.total.toFixed(2)}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              By placing your order, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}