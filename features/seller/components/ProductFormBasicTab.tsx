'use client';

import React, { useState } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { ProductFormData } from '@/domains/catalog/contracts/product-form.schema';
import { Label } from '@/shared/ui/atoms/label';
import { Input } from '@/shared/ui/atoms/input';
import { Textarea } from '@/shared/ui/atoms/textarea';
import { Button } from '@/shared/ui/atoms/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/atoms/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/shared/ui/atoms/command';
import { Category, Brand } from '@/shared/types/product';

interface ProductFormBasicTabProps {
  form: UseFormReturn<ProductFormData>;
  categoryList: Category[];
  brandList: Brand[];
}

export function ProductFormBasicTab({ form, categoryList, brandList }: ProductFormBasicTabProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input id="name" placeholder="e.g., iPhone 16 Pro 256GB" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
          <Input id="sku" placeholder="SKU-XXXXXX" {...register('sku')} />
          {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku.message}</p>}
        </div>

        <div>
          <Label htmlFor="slug">URL Slug</Label>
          <Input id="slug" placeholder="slug-path" {...register('slug')} />
          {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {field.value
                      ? categoryList.find((cat) => cat.id === field.value)?.name
                      : 'Select category'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {categoryList.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={cat.name}
                          onSelect={() => {
                            field.onChange(cat.id);
                            setCategoryOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${field.value === cat.id ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.categoryId && (
            <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Brand</Label>
          <Controller
            name="brandId"
            control={control}
            render={({ field }) => (
              <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {field.value
                      ? brandList.find((brand) => brand.id === field.value)?.name
                      : 'Select brand'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search brands..." />
                    <CommandEmpty>No brand found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {brandList.map((brand) => (
                        <CommandItem
                          key={brand.id}
                          value={brand.name}
                          onSelect={() => {
                            field.onChange(brand.id);
                            setBrandOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${field.value === brand.id ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {brand.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detailed Description *</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Provide a rich description..."
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>
    </div>
  );
}
