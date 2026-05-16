import { use } from 'react';
import { Printer } from 'lucide-react';

export default function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const items = [
    { name: 'Wireless Earbuds Pro', qty: 1, price: 2499 },
    { name: 'Phone Case XR', qty: 2, price: 299 },
  ];
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const shipping = 49;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Invoice</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      <div className="rounded-xl border p-8 shadow-sm print:shadow-none print:border-none">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">E-Shop</p>
            <p className="text-sm text-muted-foreground">123 Commerce St, Mumbai 400001</p>
            <p className="text-sm text-muted-foreground">GST: 27AABCE1234F1Z5</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">Tax Invoice</p>
            <p className="text-sm text-muted-foreground">Order #{id}</p>
            <p className="text-sm text-muted-foreground">Date: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bill To</p>
          <p className="font-semibold">John Doe</p>
          <p className="text-sm text-muted-foreground">12 MG Road, Bangalore, Karnataka — 560001</p>
          <p className="text-sm text-muted-foreground">john@example.com · +91 9876543210</p>
        </div>

        {/* Items Table */}
        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-semibold">Item</th>
              <th className="pb-2 text-center font-semibold">Qty</th>
              <th className="pb-2 text-right font-semibold">Price</th>
              <th className="pb-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.name} className="border-b">
                <td className="py-3">{item.name}</td>
                <td className="py-3 text-center">{item.qty}</td>
                <td className="py-3 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right">₹{(item.qty * item.price).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-64 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>₹{shipping}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Thank you for shopping with E-Shop! For any queries, contact support@eshop.com
        </p>
      </div>
    </div>
  );
}
