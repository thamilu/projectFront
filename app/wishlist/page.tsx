'use client';

import { useState } from 'react';
import { logger } from '@/lib/observability/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ShoppingCart, 
  Search, 
  Filter, 
  Share2, 
  Trash2,
  Star,
  TrendingUp,
  Bell,
  Grid,
  List,
  Plus,
  MoreVertical
} from 'lucide-react';

// Mock wishlist data
const mockWishlists = [
  {
    id: 1,
    name: 'Electronics Wishlist',
    items: [
      {
        id: 1,
        name: 'Wireless Headphones Pro',
        price: 299.99,
        originalPrice: 349.99,
        discount: 14,
        rating: 4.8,
        reviews: 2341,
        inStock: true,
        priceDropAlert: true,
        image: '/placeholder-1.jpg',
        category: 'Electronics'
      },
      {
        id: 2,
        name: 'Smart Watch Series 7',
        price: 399.99,
        originalPrice: 399.99,
        discount: 0,
        rating: 4.9,
        reviews: 1876,
        inStock: false,
        priceDropAlert: false,
        image: '/placeholder-2.jpg',
        category: 'Electronics'
      }
    ],
    isPublic: false,
    createdAt: '2024-11-15'
  },
  {
    id: 2,
    name: 'Home & Garden',
    items: [
      {
        id: 3,
        name: 'Smart Garden System',
        price: 149.99,
        originalPrice: 179.99,
        discount: 17,
        rating: 4.6,
        reviews: 543,
        inStock: true,
        priceDropAlert: true,
        image: '/placeholder-3.jpg',
        category: 'Home'
      }
    ],
    isPublic: true,
    createdAt: '2024-10-20'
  }
];

export default function WishlistPage() {
  const [wishlists, setWishlists] = useState(mockWishlists);
  const [selectedWishlist, setSelectedWishlist] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');

  const currentWishlist = wishlists.find(w => w.id === selectedWishlist);
  const filteredItems = currentWishlist?.items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalItems = wishlists.reduce((sum, wishlist) => sum + wishlist.items.length, 0);
  const priceDropItems = wishlists.flatMap(w => w.items).filter(item => item.priceDropAlert).length;

  const moveToCart = (itemId: number) => {
    logger.info('Moving item to cart', { itemId });
    // Implementation for moving to cart
  };

  const removeFromWishlist = (itemId: number) => {
    setWishlists(prev => prev.map(wishlist => 
      wishlist.id === selectedWishlist 
        ? { ...wishlist, items: wishlist.items.filter(item => item.id !== itemId) }
        : wishlist
    ));
  };

  const createWishlist = () => {
    if (newWishlistName.trim()) {
      const newWishlist = {
        id: Date.now(),
        name: newWishlistName,
        items: [],
        isPublic: false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setWishlists(prev => [...prev, newWishlist]);
      setNewWishlistName('');
      setShowCreateModal(false);
      setSelectedWishlist(newWishlist.id);
    }
  };

  const shareWishlist = (wishlistId: number) => {
    const wishlist = wishlists.find(w => w.id === wishlistId);
    if (wishlist) {
      const shareUrl = `${window.location.origin}/wishlist/shared/${wishlistId}`;
      navigator.clipboard.writeText(shareUrl);
      // Show toast notification
      logger.info('Wishlist shared', { shareUrl });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="text-3xl font-bold">My Wishlists</h1>
            <Badge variant="secondary">{totalItems} items</Badge>
            {priceDropItems > 0 && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                {priceDropItems} price drops
              </Badge>
            )}
          </div>
          
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Wishlist
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Wishlist Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Wishlists</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {wishlists.map((wishlist) => (
                    <div
                      key={wishlist.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedWishlist === wishlist.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedWishlist(wishlist.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{wishlist.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {wishlist.items.length} items
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {wishlist.isPublic && (
                            <Share2 className="w-4 h-4 text-blue-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareWishlist(wishlist.id);
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Wishlist Analytics */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Items</span>
                  <Badge variant="outline">{totalItems}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Price Drops</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {priceDropItems}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Price</span>
                  <span className="font-medium">
                    ${currentWishlist ? 
                      (currentWishlist.items.reduce((sum, item) => sum + item.price, 0) / currentWishlist.items.length).toFixed(2) 
                      : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Potential Savings</span>
                  <span className="font-medium text-green-600">
                    ${currentWishlist ? 
                      currentWishlist.items.reduce((sum, item) => sum + (item.originalPrice - item.price), 0).toFixed(2) 
                      : '0.00'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentWishlist && (
              <>
                {/* Filters and Controls */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button variant="outline" size="sm">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareWishlist(currentWishlist.id)}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Items Grid/List */}
                {filteredItems.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">
                        {searchQuery ? 'No items found' : 'Your wishlist is empty'}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {searchQuery 
                          ? 'Try adjusting your search terms.'
                          : 'Start adding items you love to your wishlist.'}
                      </p>
                      {!searchQuery && (
                        <Button>Browse Products</Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                    {filteredItems.map((item) => (
                      <Card key={item.id} className="group hover:shadow-lg transition-all">
                        <CardContent className="p-0">
                          <div className="relative">
                            {/* Product Image */}
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative">
                              {item.priceDropAlert && (
                                <Badge className="absolute top-3 left-3 bg-red-100 text-red-800 border-red-200">
                                  <Bell className="w-3 h-3 mr-1" />
                                  Price Drop!
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                                onClick={() => removeFromWishlist(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {/* Product Info */}
                            <div className="p-4">
                              <div className="mb-2">
                                <h3 className="font-semibold text-lg line-clamp-2">{item.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="ml-1 text-sm text-muted-foreground">
                                      {item.rating} ({item.reviews})
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {item.category}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl font-bold">${item.price.toFixed(2)}</span>
                                {item.discount > 0 && (
                                  <>
                                    <span className="text-sm text-muted-foreground line-through">
                                      ${item.originalPrice.toFixed(2)}
                                    </span>
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      {item.discount}% OFF
                                    </Badge>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1" 
                                  onClick={() => moveToCart(item.id)}
                                  disabled={!item.inStock}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                                </Button>
                                <Button variant="outline" size="icon" aria-label="Share product">
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              {!item.inStock && (
                                <div className="mt-2 text-center">
                                  <Button variant="ghost" size="sm" className="text-blue-600">
                                    <Bell className="w-4 h-4 mr-1" />
                                    Notify when available
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {currentWishlist && currentWishlist.items.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredItems.length} items selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Move All to Cart
                  </Button>
                  <Button variant="outline" size="sm">
                    Share Wishlist
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    Clear Wishlist
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Wishlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Wishlist</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter wishlist name..."
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createWishlist()}
                className="mb-4"
              />
              <div className="flex gap-2">
                <Button onClick={createWishlist} className="flex-1">
                  Create
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}