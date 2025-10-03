"use client";

import { FileDown, Search, SlidersHorizontal, Trash2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface DataTableToolbarProps {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  columnFilters: Record<string, string>;
  setColumnFilters: (filters: Record<string, string>) => void;
  headers: string[];
  onExport: () => void;
  highlightEnabled: boolean;
  setHighlightEnabled: (enabled: boolean) => void;
  onClear: () => void;
}

export function DataTableToolbar({
  globalFilter,
  setGlobalFilter,
  columnFilters,
  setColumnFilters,
  headers,
  onExport,
  highlightEnabled,
  setHighlightEnabled,
  onClear,
}: DataTableToolbarProps) {
  const handleColumnFilterChange = (header: string, value: string) => {
    setColumnFilters({ ...columnFilters, [header]: value });
  };
  
  const activeFilterCount = Object.values(columnFilters).filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex-1 w-full sm:w-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-10 w-full sm:w-[250px] lg:w-[300px]"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filter Columns
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Column Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Filter data by specific columns.
                </p>
              </div>
              <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
                {headers.map((header) => (
                  <div key={header} className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor={header} className="col-span-1 truncate text-xs">{header}</Label>
                    <Input
                      id={header}
                      value={columnFilters[header] || ''}
                      onChange={(e) => handleColumnFilterChange(header, e.target.value)}
                      className="col-span-2 h-8"
                      placeholder={`Filter ${header}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={onExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
        
        <Button variant="outline" size="icon" onClick={onClear}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Clear Data</span>
        </Button>
        
        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-2">
          <Wand2 className="h-4 w-4" />
          <Label htmlFor="highlight-mode" className="text-sm font-medium">Highlight Anomalies</Label>
          <Switch
            id="highlight-mode"
            checked={highlightEnabled}
            onCheckedChange={setHighlightEnabled}
          />
        </div>
      </div>
    </div>
  );
}
