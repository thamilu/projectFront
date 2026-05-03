'use client';

import { useState } from 'react';
import { Search, Mic, Camera, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdvancedSearchProps {
  onSearch?: (query: string, filters: SearchFilters) => void;
}

interface SearchFilters {
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  inStock?: boolean;
  brand?: string;
  sortBy?: string;
}

const categories = [
  'All Categories', 'Electronics', 'Fashion', 'Home & Garden', 
  'Sports', 'Books', 'Beauty', 'Automotive'
];

const brands = [
  'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Amazon', 'Microsoft'
];

export default function AdvancedSearch({ onSearch }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'All Categories',
    priceRange: [0, 1000],
    rating: 0,
    inStock: false,
    brand: '',
    sortBy: 'relevance'
  });
  const [suggestions] = useState([
    'wireless headphones',
    'smart watch',
    'bluetooth speaker',
    'laptop accessories',
    'phone cases'
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as Record<string, unknown>).webkitSpeechRecognition || (window as Record<string, unknown>).SpeechRecognition;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition: any = new (SpeechRecognition as new () => any)();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = (event.results as Array<Array<{transcript: string}>>)[0][0].transcript;
        setQuery(transcript);
        handleSearch(transcript);
      };

      recognition.start();
    }
  };

  const handleImageSearch = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Simulate image processing
        // Image search processing
        setQuery(`Image search: ${file.name}`);
      }
    };
    input.click();
  };

  const handleSearch = (searchQuery: string = query) => {
    onSearch?.(searchQuery, filters);
    setShowSuggestions(false);
  };

  const updateFilter = (key: keyof SearchFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'All Categories',
      priceRange: [0, 1000],
      rating: 0,
      inStock: false,
      brand: '',
      sortBy: 'relevance'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center border rounded-lg bg-background shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products, brands, categories..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => setShowSuggestions(query.length > 0)}
              className="pl-10 pr-4 border-0 focus:ring-0"
            />
          </div>
          
          <div className="flex items-center gap-2 px-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={startVoiceSearch}
              className={`${isListening ? 'text-red-500 animate-pulse' : ''}`}
              title="Voice Search"
            >
              <Mic className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImageSearch}
              title="Image Search"
            >
              <Camera className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              title="Advanced Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button onClick={() => handleSearch()}>
              Search
            </Button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10">
            <div className="p-2">
              <div className="text-xs text-muted-foreground mb-2">Suggestions</div>
              {suggestions
                .filter(suggestion => 
                  suggestion.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 5)
                .map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                  >
                    <Search className="inline w-3 h-3 mr-2 text-muted-foreground" />
                    {suggestion}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Advanced Filters</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Price Range: ${filters.priceRange?.[0]} - ${filters.priceRange?.[1]}
              </label>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange?.[0] || 0}
                  onChange={(e) => updateFilter('priceRange', [
                    parseInt(e.target.value), 
                    filters.priceRange?.[1] || 1000
                  ])}
                  className="flex-1"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange?.[1] || 1000}
                  onChange={(e) => updateFilter('priceRange', [
                    filters.priceRange?.[0] || 0,
                    parseInt(e.target.value)
                  ])}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => updateFilter('rating', star)}
                    className={`p-1 ${(filters.rating || 0) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => updateFilter('brand', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Stock Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => updateFilter('inStock', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">In Stock Only</span>
              </label>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="relevance">Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="newest">Newest First</option>
                <option value="bestseller">Best Sellers</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleSearch()} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}