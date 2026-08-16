'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/shared/ui/atoms/dropdown-menu';
import {
  Package,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Edit,
  Eye,
  History,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Archive,
  SearchX
} from 'lucide-react';
import { cn } from '@/shared/utils';

interface InventoryTableProps {
  products: any[];
  onSync: () => void;
  isSyncing: boolean;
  syncProgress: number | null;
}

type SortField = 'name' | 'sku' | 'stock' | 'price';
type SortOrder = 'asc' | 'desc';

export function InventoryTable({ products, onSync, isSyncing, syncProgress }: InventoryTableProps) {
  // Local state for search, filters, sorting, bulk actions, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Extend mock product details to accommodate categories, brands, warehouses
  const extendedProducts = useMemo(() => {
    return products.map((p) => {
      // Deduce categories based on mock data patterns
      let category = 'Tech';
      let brand = 'Generic';
      let warehouse = 'Mumbai WH-1';

      if (p.name.toLowerCase().includes('sneaker') || p.name.toLowerCase().includes('nike')) {
        category = 'Apparel';
        brand = 'Nike';
        warehouse = 'Delhi WH-2';
      } else if (p.name.toLowerCase().includes('chair') || p.name.toLowerCase().includes('desk')) {
        category = 'Furniture';
        brand = 'Steelcase';
        warehouse = 'Bangalore WH-3';
      } else if (p.name.toLowerCase().includes('headphone') || p.name.toLowerCase().includes('audio')) {
        category = 'Audio';
        brand = 'Sony';
        warehouse = 'Mumbai WH-1';
      } else if (p.name.toLowerCase().includes('key') || p.name.toLowerCase().includes('monit')) {
        category = 'Tech';
        brand = 'Logitech';
        warehouse = 'Chennai WH-4';
      }

      return {
        ...p,
        category,
        brand,
        warehouse,
        price: p.price ?? 2499, // default fallback for price if empty
        stock: p.stock ?? 0 // default quantity fallback
      };
    });
  }, [products]);

  // Apply search & filters
  const filteredProducts = useMemo(() => {
    return extendedProducts
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.id && String(p.id).includes(searchQuery)) ||
          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        const matchesBrand = brandFilter === 'all' || p.brand === brandFilter;

        let matchesStock = true;
        if (stockFilter === 'instock') matchesStock = p.stock > 5;
        else if (stockFilter === 'lowstock') matchesStock = p.stock > 0 && p.stock <= 5;
        else if (stockFilter === 'outofstock') matchesStock = p.stock === 0;

        return matchesSearch && matchesCategory && matchesBrand && matchesStock;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Format for sorting
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [extendedProducts, searchQuery, categoryFilter, brandFilter, stockFilter, sortField, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Safe formatting helper to resolve NaN errors in Pricing column
  const formatPrice = (price: any) => {
    const val = Number(price);
    if (isNaN(val) || price === null || price === undefined) {
      return 'Price unavailable';
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 space-y-4">
      {/* Title area and Sync button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-base font-black text-white">Catalog Inventory</h3>
          <p className="text-xs text-slate-400">Add, sort, filter, and track product quantities across warehouses</p>
        </div>

        <Button
          onClick={onSync}
          disabled={isSyncing}
          className="shadow-primary/10 rounded-xl shadow-lg font-black text-xs h-9 px-4 bg-indigo-650 hover:bg-indigo-700 text-white"
        >
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? `Syncing (${syncProgress}%)` : 'Sync Catalog'}
        </Button>
      </div>

      {/* Toolbar - Search input and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-950/20 p-3 rounded-xl border border-slate-850/80">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="text-slate-500 absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search products by SKU or Name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 bg-slate-900 border-slate-800 text-xs text-slate-200 h-9 rounded-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-350 text-xs px-2.5 py-1 rounded-lg h-9"
            >
              <option value="all">All Categories</option>
              <option value="Audio">Audio</option>
              <option value="Apparel">Apparel</option>
              <option value="Furniture">Furniture</option>
              <option value="Tech">Tech</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Brand</span>
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-350 text-xs px-2.5 py-1 rounded-lg h-9"
            >
              <option value="all">All Brands</option>
              <option value="Nike">Nike</option>
              <option value="Sony">Sony</option>
              <option value="Logitech">Logitech</option>
              <option value="Steelcase">Steelcase</option>
              <option value="Generic">Generic</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Stock</span>
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-350 text-xs px-2.5 py-1 rounded-lg h-9"
            >
              <option value="all">All Levels</option>
              <option value="instock">In Stock</option>
              <option value="lowstock">Low Stock Alerts</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold font-mono">
              {selectedIds.length} Selected
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white text-xs gap-1.5"
            >
              <Edit className="h-3.5 w-3.5 text-indigo-400" />
              <span>Bulk Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white text-xs gap-1.5"
            >
              <Package className="h-3.5 w-3.5 text-emerald-400" />
              <span>Update Stock</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              <span>Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white text-xs gap-1.5"
            >
              <Archive className="h-3.5 w-3.5 text-amber-400" />
              <span>Archive</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-slate-800 bg-slate-900 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Table view */}
      <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/40">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-850 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3.5 w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    paginatedProducts.length > 0 &&
                    paginatedProducts.every((p) => selectedIds.includes(p.id))
                  }
                  className="rounded border-slate-800 bg-slate-900 text-indigo-650 h-3.5 w-3.5"
                  aria-label="Select all products"
                />
              </th>
              <th className="px-5 py-3.5 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1.5 select-none">
                  <span>Product Name</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th className="px-5 py-3.5 font-bold cursor-pointer hover:text-white hidden sm:table-cell" onClick={() => handleSort('sku')}>
                <div className="flex items-center gap-1.5 select-none">
                  <span>SKU Code</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th className="px-5 py-3.5 font-bold hidden md:table-cell">Warehouse & Brand</th>
              <th className="px-5 py-3.5 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('stock')}>
                <div className="flex items-center gap-1.5 select-none">
                  <span>Availability</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th className="px-5 py-3.5 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                <div className="flex items-center gap-1.5 select-none">
                  <span>Pricing</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th className="px-5 py-3.5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-xs">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-850">
                      <SearchX className="h-10 w-10 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-300">No products match your filters</p>
                      <p className="text-xs text-slate-500">
                        {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your category, brand, or stock filters'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setBrandFilter('all');
                        setStockFilter('all');
                        setCurrentPage(1);
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                const sku = product.sku ?? `NK-${product.id}102`;
                const isLow = product.stock <= 5 && product.stock > 0;
                const isCritical = product.stock === 0;

                let badgeColor = "bg-green-500/10 text-green-400 border-green-500/20";
                let statusText = "In Stock";
                let StatusIcon = CheckCircle2;
                if (isCritical) {
                  badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                  statusText = "Out of Stock";
                  StatusIcon = XCircle;
                } else if (isLow) {
                  badgeColor = "bg-orange-500/10 text-orange-400 border-orange-500/20";
                  statusText = "Low Stock Alert";
                  StatusIcon = AlertTriangle;
                }

                const isChecked = selectedIds.includes(product.id);

                return (
                  <tr
                    key={product.id}
                    className={cn(
                      "hover:bg-slate-900/30 transition-colors",
                      isChecked && "bg-indigo-950/15"
                    )}
                  >
                    {/* Checkbox column */}
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-650 h-3.5 w-3.5"
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                    
                    {/* Name */}
                    <td className="px-5 py-3.5 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 rounded-lg p-2 border border-slate-850 shrink-0 select-none">
                          <Package className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="block truncate max-w-[200px]">{product.name}</span>
                          <span className="sm:hidden block text-[10px] text-slate-500 font-mono">{sku}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* SKU Code (High contrast text color) */}
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-300 hidden sm:table-cell">
                      {sku}
                    </td>

                    {/* Warehouse details */}
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-450 leading-tight">
                      <span className="block font-medium text-slate-350">{product.brand}</span>
                      <span className="block text-[10px]">{product.warehouse}</span>
                    </td>
                    
                    {/* Availability Status Badge (Increased padding) */}
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border",
                        badgeColor
                      )}>
                        <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{statusText} (Qty: {product.stock !== undefined && product.stock !== null ? product.stock : 0})</span>
                      </span>
                    </td>
                    
                    {/* Price Column */}
                    <td className="px-5 py-3.5 font-bold text-white">
                      {formatPrice(product.price)}
                    </td>
                    
                    {/* Actions column */}
                    <td className="px-5 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label="Product actions" variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                          <DropdownMenuLabel className="text-slate-500 text-[10px] uppercase font-bold">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem className="hover:bg-slate-800 cursor-pointer text-xs gap-2">
                            <Eye className="h-3.5 w-3.5 text-indigo-400" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-slate-800 cursor-pointer text-xs gap-2">
                            <Edit className="h-3.5 w-3.5 text-indigo-400" /> Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-slate-800 cursor-pointer text-xs gap-2">
                            <History className="h-3.5 w-3.5 text-indigo-400" /> View Stock History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem className="hover:bg-rose-950/30 hover:text-rose-300 cursor-pointer text-xs gap-2 text-rose-450">
                            <Trash2 className="h-3.5 w-3.5" /> Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3.5 border-t border-slate-850/80">
        <div className="flex items-center gap-2.5 text-xs text-slate-450">
          {filteredProducts.length <= 5 ? (
            <span>Showing all <span className="font-mono text-slate-350">{filteredProducts.length} items</span></span>
          ) : (
            <>
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 text-slate-350 text-xs px-2 py-0.5 rounded-lg"
              >
                {[5, 10, 20].filter(n => n <= filteredProducts.length || n === 5).map(n => (
                  <option key={n} value={n}>{n} items</option>
                ))}
              </select>
              <span>of <span className="font-mono text-slate-350">{filteredProducts.length} items</span></span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="h-8 rounded-lg border-slate-800 bg-slate-900 text-slate-350 hover:bg-slate-850 hover:text-white text-xs disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4 mr-0.5" />
            Prev
          </Button>

          {/* Simple Page numbers */}
          <div className="flex items-center gap-1 select-none">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "h-8 w-8 text-xs font-bold rounded-lg transition-colors border",
                  currentPage === i + 1
                    ? "bg-indigo-650 text-white border-transparent"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="h-8 rounded-lg border-slate-800 bg-slate-900 text-slate-350 hover:bg-slate-850 hover:text-white text-xs disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
