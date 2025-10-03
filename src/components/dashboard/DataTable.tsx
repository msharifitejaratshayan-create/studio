"use client";

import React from 'react';
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

type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
};

interface DataTableProps {
  headers: string[];
  data: Record<string, any>[];
  sortConfig: SortConfig | null;
  requestSort: (key: string) => void;
  highlightedRows: boolean[];
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

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
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
                  className={cn(
                    highlightedRows[rowIndex] && 'bg-destructive/10 hover:bg-destructive/20'
                  )}
                >
                  {headers.map((header) => (
                    <TableCell key={header} className="max-w-[200px] truncate">
                      {String(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} className="h-24 text-center">
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
    </div>
  );
}
