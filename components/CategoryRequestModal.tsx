import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { safeFetch } from '@/lib/utils/fetch-utils';
import { handleError, getUserFriendlyMessage } from '@/lib/utils/error-utils';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryRequestModal({ onClose, onSuccess }: Props) {
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await safeFetch('/api/seller/categories/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName, description, reason }),
      });
      onSuccess();
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      handleError(err, '[CategoryRequest] Submit failed');
      setError(getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-opacity-30 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">Request New Category</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block">Category Name</label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
