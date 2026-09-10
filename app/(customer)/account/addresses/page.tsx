'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Plus, Pencil, Trash2, CheckCircle2, Home, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/atoms/dialog';
import { Input } from '@/shared/ui/atoms/input';
import { Label } from '@/shared/ui/atoms/label';
import { motion } from 'framer-motion';
import { useAddresses } from '@/features/addresses/hooks/use-addresses';
import type { AddressDTO } from '@/features/addresses/api/address-api';

const TypeIcon = ({ type }: { type: AddressDTO['type'] }) =>
  type === 'Home' ? (
    <Home className="h-4 w-4" />
  ) : type === 'Work' ? (
    <Briefcase className="h-4 w-4" />
  ) : (
    <MapPin className="h-4 w-4" />
  );

export default function AddressesPage() {
  const { data: session } = useSession();
  const { addresses, isLoading, saveAddress, deleteAddress, setDefaultAddress, isSaving } =
    useAddresses();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AddressDTO>>({
    type: 'Home',
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      await saveAddress({ id: editingId || undefined, address: formData });
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({
      type: 'Home',
      name: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
    });
    setOpen(true);
  };

  const openEditDialog = (addr: AddressDTO) => {
    setEditingId(addr.id);
    setFormData(addr);
    setOpen(true);
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view saved addresses.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto max-w-2xl px-4 py-10"
    >
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Saved Addresses</h1>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className={addr.isDefault ? 'border-primary' : ''}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="gap-1 text-xs">
                        <TypeIcon type={addr.type} /> {addr.type}
                      </Badge>
                      {addr.isDefault && (
                        <Badge className="gap-1 bg-green-100 text-xs text-green-700 hover:bg-green-100 hover:text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3" /> Default
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{addr.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                      📞 {addr.phone}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-background gap-1"
                      onClick={() => openEditDialog(addr)}
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-background text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                      onClick={() => handleDelete(addr.id)}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                    {!addr.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-background gap-1 text-xs"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        Set Default
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {addresses.length === 0 && (
            <div className="text-muted-foreground mt-12 text-center">
              <MapPin className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>No saved addresses yet.</p>
              <Button className="mt-4" onClick={openAddDialog}>
                Add your first address
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Address Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address Line 1</Label>
              <Input
                value={formData.line1 || ''}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                placeholder="House/Flat, Street"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address Line 2</Label>
              <Input
                value={formData.line2 || ''}
                onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                placeholder="Area, Landmark (optional)"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="Pincode"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isSaving} onClick={handleSave}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Update Address' : 'Save Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
