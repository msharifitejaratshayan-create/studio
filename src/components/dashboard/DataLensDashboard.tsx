"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  Loader2,
  PieChart,
  BarChart2,
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

import { exportToCsv, parseCsv } from '@/lib/csv';
import { useToast } from '@/hooks/use-toast';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

type HighlightType = 'red' | 'green' | 'none';

const ROWS_PER_PAGE = 50;

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))'];
const STACKED_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export function DataLensDashboard() {
  const [threadsData, setThreadsData] = useState<CsvData | null>(null);
  const [nonThreadsData, setNonThreadsData] = useState<CsvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [highlightedRows, setHighlightedRows] = useState<HighlightType[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [threadsRes, nonThreadsRes] = await Promise.all([
          fetch('/data/threads.csv'),
          fetch('/data/nonthreads.csv')
        ]);

        if (threadsRes.ok) {
          const threadsCsv = await threadsRes.text();
          setThreadsData(parseCsv(threadsCsv));
        } else {
            console.warn('Could not load threads.csv. The resource may not be available.');
        }

        if (nonThreadsRes.ok) {
          const nonThreadsCsv = await nonThreadsRes.text();
          setNonThreadsData(parseCsv(nonThreadsCsv));
        } else {
            console.warn('Could not load nonthreads.csv. The resource may not be available.');
        }

      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while fetching data.';
        setError(`Failed to fetch CSV data. Please check the console for more details. Error: ${errorMessage}`);
        toast({
            variant: 'destructive',
            title: "Error fetching data",
            description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    if (combinedData && highlightEnabled && combinedData.data.length > 0) {
      const newHighlightedRows = combinedData.data.map(row => {
        const score = parseFloat(row['AnomalyScore']);
        if (isNaN(score)) {
          return 'none';
        }
        return score > 0.5 ? 'red' : 'green';
      });
      setHighlightedRows(newHighlightedRows);
    } else {
      setHighlightedRows([]);
    }
  }, [combinedData, highlightEnabled]);

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
      return highlightedRows[originalIndex] || 'none';
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
    toast({ title: "Local data cleared." });
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
      threads: 0,
      nonThreads: 0,
    }));

    combinedData.data.forEach(row => {
      const score = parseFloat(row['AnomalyScore']);
      if (!isNaN(score) && score >= 0 && score <= 1) {
        const binIndex = Math.min(Math.floor(score * 10), 9);
        if (row.__source === 'thread') {
          bins[binIndex].threads++;
        } else {
          bins[binIndex].nonThreads++;
        }
      }
    });

    return bins;
  }, [combinedData]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
          <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
      </div>
    );
  }

  if (error) {
      return (
          <div className="p-8 flex justify-center items-center h-screen">
              <Alert variant="destructive" className="max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          </div>
      )
  }
  
  if (!combinedData || combinedData.data.length === 0) {
      return (
           <div className="p-8 flex justify-center items-center h-screen">
              <Alert className="max-w-lg">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data Found</AlertTitle>
                <AlertDescription>
                    Could not load CSV data from the provided URLs. Please ensure the data sources are available and accessible.
                </AlertDescription>
              </Alert>
          </div>
      )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        <>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">DataLens Dashboard</h1>
              <p className="text-muted-foreground">
                Displaying {filteredData.length} of {combinedData?.data.length || 0} total rows.
              </p>
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
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {combinedData?.data.some(d => d['AnomalyScore']) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsBarChart data={anomalyScoreData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="threads" stackId="a" name="Threads" fill={STACKED_COLORS[0]} />
                      <Bar dataKey="nonThreads" stackId="a" name="Non-Threads" fill={STACKED_COLORS[1]} />
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
    </div>
  );
}
