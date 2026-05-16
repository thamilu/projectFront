"use client";

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Filter, AlertTriangle, Save } from 'lucide-react';
import { useState } from 'react';

// Mock inventory data
const MOCK_INVENTORY = [
  { id: 1, name: 'Premium Wireless Headphones', sku: 'AUDIO-001', stock: 45, threshold: 10, status: 'In Stock' },
  { id: 2, name: 'Ergonomic Office Chair', sku: 'FUR-002', stock: 8, threshold: 15, status: 'Low Stock' },
  { id: 3, name: 'Mechanical Keyboard RGB', sku: 'TECH-003', stock: 0, threshold: 5, status: 'Out of Stock' },
  { id: 4, name: '4K Monitor 27"', sku: 'TECH-004', stock: 12, threshold: 8, status: 'Low Stock' },
  { id: 5, name: 'USB-C Docking Station', sku: 'ACC-005', stock: 65, threshold: 20, status: 'In Stock' },
];

export default function SellerInventoryPage() {
  const { data: _session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockUpdate = (id: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        let status = 'In Stock';
        if (editValue === 0) status = 'Out of Stock';
        else if (editValue <= item.threshold) status = 'Low Stock';
        
        return { ...item, stock: editValue, status };
      }
      return item;
    }));
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 md:px-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
              <p className="text-muted-foreground">Manage stock levels and alerts</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory.length}</div>
                <p className="text-xs text-muted-foreground">Active SKUs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {inventory.filter(i => i.stock <= i.threshold && i.stock > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">Items below threshold</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {inventory.filter(i => i.stock === 0).length}
                </div>
                <p className="text-xs text-muted-foreground">Restock needed immediately</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stock Levels</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or SKU..." 
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-4 font-medium">Product Name</th>
                      <th className="p-4 font-medium">SKU</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Stock Level</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="border-b transition-colors hover:bg-muted/20">
                        <td className="p-4 font-medium">{item.name}</td>
                        <td className="p-4 text-muted-foreground">{item.sku}</td>
                        <td className="p-4">
                          <Badge 
                            variant="secondary" 
                            className={`
                              ${item.status === 'In Stock' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                              ${item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : ''}
                              ${item.status === 'Out of Stock' ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''}
                            `}
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          {editingId === item.id ? (
                            <div className="flex justify-end">
                              <Input 
                                type="number" 
                                className="h-8 w-20 text-right" 
                                value={editValue}
                                onChange={(e) => setEditValue(Number(e.target.value))}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className={item.stock <= item.threshold ? 'font-bold text-orange-600' : ''}>
                              {item.stock}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {editingId === item.id ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                              <Button size="sm" onClick={() => handleStockUpdate(item.id)}>Save</Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setEditValue(item.stock); }}>
                              Adjust
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
