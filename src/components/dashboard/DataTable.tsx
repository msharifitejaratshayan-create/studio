"use client";

import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DataTablePagination } from './DataTablePagination';
import { DataTableRowDetails } from './DataTableRowDetails';

type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
};

type HighlightType = 'red' | 'green' | 'none';

interface DataTableProps {
  headers: string[];
  data: Record<string, any>[];
  sortConfig: SortConfig | null;
  requestSort: (key: string) => void;
  highlightedRows: HighlightType[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  totalRows: number;
}

export function DataTable({
  headers,
  data,
  sortConfig,
  requestSort,
  highlightedRows,
  currentPage,
  totalPages,
  setCurrentPage,
  rowsPerPage,
  totalRows
}: DataTableProps) {
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);

  const displayHeaders = ['query', 'AnomalyScore'].filter(h => headers.includes(h));

  if (displayHeaders.length === 0 && data.length > 0) {
      displayHeaders.push(...headers.slice(0, 2));
  }


  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {displayHeaders.map((header) => (
                <TableHead key={header}>
                  <Button
                    variant="ghost"
                    onClick={() => requestSort(header)}
                    className="px-2"
                  >
                    {header}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={() => setSelectedRow(row)}
                  className={cn(
                    'cursor-pointer',
                    highlightedRows[rowIndex] === 'red' && 'bg-destructive/10 hover:bg-destructive/20',
                    highlightedRows[rowIndex] === 'green' && 'bg-green-500/10 hover:bg-green-500/20'
                  )}
                >
                  {displayHeaders.map((header) => (
                    <TableCell key={header} className="max-w-[200px] truncate">
                      {String(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={displayHeaders.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
        />
      )}
      <DataTableRowDetails 
        row={selectedRow}
        allHeaders={headers}
        open={!!selectedRow}
        onOpenChange={(isOpen) => !isOpen && setSelectedRow(null)}
      />
    </div>
  );
}
