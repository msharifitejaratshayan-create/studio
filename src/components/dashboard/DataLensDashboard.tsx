"use client";

import React, { useState, useMemo, useEffect, useCallback, DragEvent } from 'react';
import {
  AlertCircle,
  FileCode,
  Loader2,
  UploadCloud,
  PieChart,
  BarChart,
  CheckCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart as RechartsBarChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';


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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))'];


const FileUploader = ({ title, onFileUpload, isLoading, error, hasData }: { title: string, onFileUpload: (file: File) => void, isLoading: boolean, error: string | null, hasData: boolean }) => {
  const [isDragging, setIsDragging] = useState(false);

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
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (hasData) {
    return (
       <Card className="w-full shadow-lg border-2 border-primary/50">
        <CardHeader className="text-center">
            <div className="mx-auto bg-green-500/10 text-green-500 p-3 rounded-full w-fit mb-4">
            <CheckCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription>File loaded successfully.</CardDescription>
        </CardHeader>
        <CardContent>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-border hover:border-primary/50 hover:bg-muted">
                <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Click here</span> to upload a new file
                    </p>
                </div>
                <input type="file" accept=".csv" onChange={(e) => e.target.files && onFileUpload(e.target.files[0])} className="hidden" />
            </label>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
          <FileCode className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
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
          <input type="file" accept=".csv" onChange={(e) => e.target.files && onFileUpload(e.target.files[0])} className="hidden" />
        </label>
        {isLoading && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              {"Uploading & Parsing..."}
            </p>
            <Progress value={50} />
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
  )
}

export function DataLensDashboard() {
  const [threadsData, setThreadsData] = useState<CsvData | null>(null);
  const [nonThreadsData, setNonThreadsData] = useState<CsvData | null>(null);
  
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [nonThreadsError, setNonThreadsError] = useState<string | null>(null);

  const [threadsLoading, setThreadsLoading] = useState(false);
  const [nonThreadsLoading, setNonThreadsLoading] = useState(false);
  
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [highlightedRows, setHighlightedRows] = useState<boolean[]>([]);

  const { toast } = useToast();

  const handleFileUpload = useCallback((file: File, type: 'threads' | 'non-threads') => {
    if (!file) return;
    if (file.type !== 'text/csv') {
      const errorMsg = 'Invalid file type. Please upload a CSV file.';
      if (type === 'threads') setThreadsError(errorMsg);
      else setNonThreadsError(errorMsg);
      return;
    }

    if (type === 'threads') {
      setThreadsLoading(true);
      setThreadsError(null);
    } else {
      setNonThreadsLoading(true);
      setNonThreadsError(null);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCsv(text);
        
        if (type === 'threads') {
          setThreadsData(parsedData);
        } else {
          setNonThreadsData(parsedData);
        }

        setCurrentPage(1);
        setSortConfig(null);
        setGlobalFilter('');
        setColumnFilters({});
        toast({
          title: "Upload successful",
          description: `Loaded ${parsedData.data.length} rows and ${parsedData.headers.length} columns for ${type}.`,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred during parsing.';
        if (type === 'threads') {
          setThreadsError(errorMsg);
          setThreadsData(null);
        } else {
          setNonThreadsError(errorMsg);
          setNonThreadsData(null);
        }
        toast({
          variant: 'destructive',
          title: "Parsing Error",
          description: err instanceof Error ? err.message : `Could not parse the ${type} CSV file.`,
        });
      } finally {
        if (type === 'threads') setThreadsLoading(false);
        else setNonThreadsLoading(false);
      }
    };
    reader.onerror = () => {
      const errorMsg = 'Failed to read the file.';
       if (type === 'threads') {
          setThreadsError(errorMsg);
          setThreadsLoading(false);
        } else {
          setNonThreadsError(errorMsg);
          setNonThreadsLoading(false);
        }
       toast({
          variant: 'destructive',
          title: "File Read Error",
          description: `There was an issue reading your ${type} file.`,
        });
    };
    reader.readAsText(file);
  }, [toast]);
  
  const combinedData = useMemo(() => {
    if (!threadsData && !nonThreadsData) return null;
    
    const threads = threadsData?.data.map(d => ({...d, __source: 'thread'})) || [];
    const nonThreads = nonThreadsData?.data.map(d => ({...d, __source: 'non-thread'})) || [];

    const allData = [...threads, ...nonThreads];
    
    const allHeaders = new Set<string>();
    threadsData?.headers.forEach(h => allHeaders.add(h));
    nonThreadsData?.headers.forEach(h => allHeaders.add(h));
    
    return {
      headers: Array.from(allHeaders),
      data: allData
    };

  }, [threadsData, nonThreadsData]);
  

  useEffect(() => {
    const processHighlighting = async () => {
      if (combinedData && highlightEnabled && combinedData.data.length > 0) {
        setIsAiProcessing(true);
        try {
          const result = await highlightAnomalousRows({
            dataRows: combinedData.data,
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
  }, [combinedData, highlightEnabled, toast]);

  const filteredData = useMemo(() => {
    if (!combinedData) return [];
    return combinedData.data.filter((row) => {
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
  }, [combinedData, globalFilter, columnFilters]);

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
    if (!highlightEnabled || highlightedRows.length === 0 || !combinedData) return [];
    
    return paginatedData.map(paginatedRow => {
      const originalIndex = combinedData.data.findIndex(originalRow => originalRow === paginatedRow);
      return highlightedRows[originalIndex] || false;
    });

  }, [paginatedData, highlightedRows, highlightEnabled, combinedData]);

  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);

  const handleExport = () => {
    if (combinedData) {
      exportToCsv('filtered_data.csv', combinedData.headers, sortedData);
    }
  };
  
  const handleClear = () => {
    setThreadsData(null);
    setNonThreadsData(null);
    setThreadsError(null);
    setNonThreadsError(null);
  }
  
  const pieChartData = useMemo(() => {
    return [
      { name: 'Threads', value: threadsData?.data.length || 0 },
      { name: 'Non-Threads', value: nonThreadsData?.data.length || 0 }
    ].filter(d => d.value > 0);
  }, [threadsData, nonThreadsData]);

  const anomalyScoreData = useMemo(() => {
    if (!combinedData) return [];
    
    const bins = Array.from({ length: 10 }, (_, i) => ({
      name: `${(i * 0.1).toFixed(1)}-${((i + 1) * 0.1).toFixed(1)}`,
      count: 0
    }));

    combinedData.data.forEach(row => {
      const score = parseFloat(row['AnomalyScore']);
      if (!isNaN(score) && score >= 0 && score <= 1) {
        const binIndex = Math.min(Math.floor(score * 10), 9);
        bins[binIndex].count++;
      }
    });

    return bins;
  }, [combinedData]);

  const hasAnyData = threadsData || nonThreadsData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-8 w-full">
        <FileUploader title="Threads CSV" onFileUpload={(file) => handleFileUpload(file, 'threads')} isLoading={threadsLoading} error={threadsError} hasData={!!threadsData}/>
        <FileUploader title="Non-Threads CSV" onFileUpload={(file) => handleFileUpload(file, 'non-threads')} isLoading={nonThreadsLoading} error={nonThreadsError} hasData={!!nonThreadsData} />
      </div>

      {hasAnyData && (
        <>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">DataLens Dashboard</h1>
              <p className="text-muted-foreground">
                Displaying {filteredData.length} of {combinedData?.data.length || 0} total rows.
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
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-full lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threads vs Non-Threads</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                </ResponsiveContainer>
                ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground">Please upload data</div>}
              </CardContent>
            </Card>
            <Card className="col-span-full lg:col-span-5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anomaly Score Distribution</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {combinedData?.data.some(d => d['AnomalyScore']) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsBarChart data={anomalyScoreData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground">`AnomalyScore` column not found or empty.</div>}
              </CardContent>
            </Card>
          </div>

          <DataTableToolbar
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            headers={combinedData?.headers || []}
            onExport={handleExport}
            highlightEnabled={highlightEnabled}
            setHighlightEnabled={setHighlightEnabled}
            onClear={handleClear}
          />

          <Card>
            <DataTable
              headers={combinedData?.headers || []}
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
        </>
      )}
    </div>
  );
}
