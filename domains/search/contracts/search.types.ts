export type SearchSuggestionType = 'product' | 'category' | 'brand' | 'recent' | 'trending';

export interface SearchSuggestion {
  id: string;
  title: string;
  type: SearchSuggestionType;
  href: string;
  category?: string;
  count?: number;
}
