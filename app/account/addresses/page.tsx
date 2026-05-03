'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Plus, Pencil, Trash2, CheckCircle2, Home, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/utils/fetch-utils';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { motion } from 'framer-motion';

interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

interface ExtendedSession {
  accessToken?: string;
}

const TypeIcon = ({ type }: { type: Address['type'] }) =>
  type === 'Home' ? <Home className="h-4 w-4" /> : type === 'Work' ? <Briefcase className="h-4 w-4" /> : <MapPin className="h-4 w-4" />;

export default function AddressesPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Address>>({
    type: 'Home',
    name: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '',
  });
  const [formSaving, setFormSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const data = await authenticatedFetch(API_ENDPOINTS.USERS.ADDRESSES, {
        accessToken: session.accessToken,
      });
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) fetchAddresses();
  }, [session?.accessToken, fetchAddresses]);

  const handleDelete = async (id: string) => {
    if (!session?.accessToken) return;
    try {
      await authenticatedFetch(`${API_ENDPOINTS.USERS.ADDRESSES}/${id}`, {
        method: 'DELETE',
        accessToken: session.accessToken,
      });
      setAddresses(a => a.filter(addr => addr.id !== id));
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!session?.accessToken) return;
    try {
      await authenticatedFetch(`${API_ENDPOINTS.USERS.ADDRESSES}/${id}/default`, {
        method: 'PUT',
        accessToken: session.accessToken,
      });
      setAddresses(a => a.map(addr => ({ ...addr, isDefault: addr.id === id })));
      toast.success('Default address updated');
    } catch (err) {
      toast.error('Failed to set default address');
    }
  };

  const handleSave = async () => {
    if (!session?.accessToken) return;
    setFormSaving(true);
    try {
      const url = editingId 
        ? `${API_ENDPOINTS.USERS.ADDRESSES}/${editingId}`
        : API_ENDPOINTS.USERS.ADDRESSES;
      const method = editingId ? 'PUT' : 'POST';
      
      await authenticatedFetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
        accessToken: session.accessToken,
      });
      
      toast.success(editingId ? 'Address updated' : 'Address added');
      setOpen(false);
      fetchAddresses();
    } catch (err) {
      toast.error('Failed to save address');
    } finally {
      setFormSaving(false);
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({ type: 'Home', name: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });
    setOpen(true);
  };

  const openEditDialog = (addr: Address) => {
    setEditingId(addr.id);
    setFormData(addr);
    setOpen(true);
  };

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

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-4">
          {addresses.map(addr => (
            <Card key={addr.id} className={addr.isDefault ? 'border-primary' : ''}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                       <Badge variant="outline" className="gap-1 text-xs">
                          <TypeIcon type={addr.type} /> {addr.type}
                        </Badge>
                        {addr.isDefault && (
                          <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs hover:bg-green-100 hover:text-green-700">
                            <CheckCircle2 className="h-3 w-3" /> Default
                          </Badge>
                        )}
                    </div>
                    <p className="font-medium">{addr.name}</p>
                    <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} — {addr.pincode}</p>
                    <p className="mt-1 text-sm text-muted-foreground font-medium">📞 {addr.phone}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button variant="outline" size="sm" className="gap-1 bg-background" onClick={() => openEditDialog(addr)}>
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(addr.id)}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                    {!addr.isDefault && (
                      <Button variant="outline" size="sm" className="gap-1 text-xs bg-background" onClick={() => handleSetDefault(addr.id)}>
                        Set Default
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {addresses.length === 0 && (
            <div className="mt-12 text-center text-muted-foreground">
              <MapPin className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>No saved addresses yet.</p>
              <Button className="mt-4" onClick={openAddDialog}>Add your first address</Button>
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
              <div className="space-y-1.5"><Label>Full Name</Label><Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" /></div>
            </div>
            <div className="space-y-1.5"><Label>Address Line 1</Label><Input value={formData.line1 || ''} onChange={e => setFormData({ ...formData, line1: e.target.value })} placeholder="House/Flat, Street" /></div>
            <div className="space-y-1.5"><Label>Address Line 2</Label><Input value={formData.line2 || ''} onChange={e => setFormData({ ...formData, line2: e.target.value })} placeholder="Area, Landmark (optional)" /></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>City</Label><Input value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City" /></div>
              <div className="space-y-1.5"><Label>State</Label><Input value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="State" /></div>
              <div className="space-y-1.5"><Label>Pincode</Label><Input value={formData.pincode || ''} onChange={e => setFormData({ ...formData, pincode: e.target.value })} placeholder="Pincode" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={formSaving} onClick={handleSave}>
              {formSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Update Address' : 'Save Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
