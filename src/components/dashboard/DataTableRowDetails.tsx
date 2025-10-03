"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface DataTableRowDetailsProps {
  row: Record<string, any> | null;
  allHeaders: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataTableRowDetails({ row, allHeaders, open, onOpenChange }: DataTableRowDetailsProps) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Row Details</DialogTitle>
          <DialogDescription>
            Complete information for the selected row.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="space-y-4 py-4">
            {allHeaders.map((header) => (
              <div key={header} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
                <Badge variant="secondary" className="md:col-span-1 justify-start break-all truncate">
                  {header}
                </Badge>
                <div className="md:col-span-3 bg-muted p-3 rounded-md text-sm break-words whitespace-pre-wrap">
                  {String(row[header])}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
