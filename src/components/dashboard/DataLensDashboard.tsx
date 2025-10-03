"use client";

import React, { useState, useMemo, useEffect, useCallback, DragEvent } from 'react';
import {
  AlertCircle,
  FileCode,
  Loader2,
  UploadCloud,
} from 'lucide-react';

import { highlightAnomalousRows } from '@/ai/flows/highlight-anomalous-rows-based-on-ai';
import { exportToCsv, parseCsv } from '@/lib/csv';
import { useToast } from '@/hooks/use-toast';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { DataTable } from './DataTable';
import { DataTableToolbar } from './DataTableToolbar';

type CsvData = {
  headers: string[];
  data: Record<string, any>[];
};

type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
};

const ROWS_PER_PAGE = 50;

export function DataLensDashboard() {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [highlightedRows, setHighlightedRows] = useState<boolean[]>([]);

  const { toast } = useToast();

  const handleFileUpload = useCallback((file: File) => {
    if (!file) return;
    if (file.type !== 'text/csv') {
      setError('Invalid file type. Please upload a CSV file.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setIsParsing(true);
        const text = e.target?.result as string;
        const parsedData = parseCsv(text);
        setCsvData(parsedData);
        setCurrentPage(1);
        setSortConfig(null);
        setGlobalFilter('');
        setColumnFilters({});
        toast({
          title: "Upload successful",
          description: `Loaded ${parsedData.data.length} rows and ${parsedData.headers.length} columns.`,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during parsing.');
        setCsvData(null);
        toast({
          variant: 'destructive',
          title: "Parsing Error",
          description: err instanceof Error ? err.message : 'Could not parse the CSV file.',
        });
      } finally {
        setIsLoading(false);
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
      setIsLoading(false);
      setIsParsing(false);
       toast({
          variant: 'destructive',
          title: "File Read Error",
          description: 'There was an issue reading your file.',
        });
    };
    reader.readAsText(file);
  }, [toast]);
  
  const handleDrag = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };


  useEffect(() => {
    const processHighlighting = async () => {
      if (csvData && highlightEnabled && csvData.data.length > 0) {
        setIsAiProcessing(true);
        try {
          const result = await highlightAnomalousRows({
            dataRows: csvData.data,
            isHighlightingEnabled: highlightEnabled,
          });
          setHighlightedRows(result.highlightedRows);
        } catch (aiError) {
          console.error('AI processing error:', aiError);
          toast({
            variant: 'destructive',
            title: 'AI Highlighting Error',
            description: 'Could not apply AI-powered highlighting.',
          });
          setHighlightedRows([]);
        } finally {
          setIsAiProcessing(false);
        }
      } else {
        setHighlightedRows([]);
      }
    };
    processHighlighting();
  }, [csvData, highlightEnabled, toast]);

  const filteredData = useMemo(() => {
    if (!csvData) return [];
    return csvData.data.filter((row) => {
      const matchesGlobal = globalFilter
        ? Object.values(row).some((val) =>
            String(val).toLowerCase().includes(globalFilter.toLowerCase())
          )
        : true;

      const matchesColumns = Object.entries(columnFilters).every(([header, filterValue]) => {
        if (!filterValue) return true;
        return String(row[header]).toLowerCase().includes(filterValue.toLowerCase());
      });

      return matchesGlobal && matchesColumns;
    });
  }, [csvData, globalFilter, columnFilters]);

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedData.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [sortedData, currentPage]);
  
  const highlightedPaginatedRows = useMemo(() => {
    if (!highlightEnabled || highlightedRows.length === 0 || !csvData) return [];
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = startIndex + ROWS_PER_PAGE;
    
    // Map paginated data back to original indices to get correct highlight status
    return paginatedData.map(paginatedRow => {
      const originalIndex = csvData.data.findIndex(originalRow => originalRow === paginatedRow);
      return highlightedRows[originalIndex] || false;
    });

  }, [paginatedData, highlightedRows, highlightEnabled, csvData, currentPage]);


  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);

  const handleExport = () => {
    if (csvData) {
      exportToCsv('filtered_data.csv', csvData.headers, sortedData);
    }
  };
  
  const handleClear = () => {
    setCsvData(null);
    setError(null);
    setIsLoading(false);
  }

  if (!csvData) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-xl mx-auto shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
               <FileCode className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">DataLens Dashboard</CardTitle>
            <CardDescription>Upload a CSV file to begin analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <label
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted'}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className={`w-10 h-10 mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`mb-2 text-sm ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}>
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">CSV files up to 50MB</p>
              </div>
              <input type="file" accept=".csv" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} className="hidden" />
            </label>
            {isLoading && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  {isParsing ? "Parsing your data..." : "Uploading file..."}
                </p>
                <Progress value={isParsing ? 50 : 25} />
              </div>
            )}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DataLens Dashboard</h1>
          <p className="text-muted-foreground">
            Displaying {filteredData.length} of {csvData.data.length} rows.
          </p>
        </div>
        <div className="flex items-center gap-2">
           {isAiProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is analyzing...</span>
            </div>
          )}
        </div>
      </div>
      
      <DataTableToolbar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
        headers={csvData.headers}
        onExport={handleExport}
        highlightEnabled={highlightEnabled}
        setHighlightEnabled={setHighlightEnabled}
        onClear={handleClear}
      />

      <Card>
        <DataTable
          headers={csvData.headers}
          data={paginatedData}
          sortConfig={sortConfig}
          requestSort={requestSort}
          highlightedRows={highlightedPaginatedRows}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          rowsPerPage={ROWS_PER_PAGE}
          totalRows={sortedData.length}
        />
      </Card>
    </div>
  );
}
