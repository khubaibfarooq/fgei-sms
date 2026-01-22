import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import axios from 'axios';
import { iconMapper } from '@/lib/iconMapper';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CheckCircle2, XCircle } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
// Define interface for card data from props.cards
interface CardData {
  id: number;
  title: string;
  link: string;
  icon: string;
  redirectlink: string;
  color: string;
  role_id: number;
  created_at: string;
  updated_at: string;
}

interface DetailCriteria {
  name: string;
  weight: number;
  completed: boolean;
  message: string;
}

interface InstituteCompletionDetails {
  institute: string;
  percentage: number;
  criteria: DetailCriteria[];
}

// Define interface for summaryData items
interface SummaryItem {
  label: string;
  value: number;
  color: string;
  redirectlink: string;
}

// Define interfaces for table data
interface TableRow {
  [key: string]: any;
}

interface TableData {
  title: string;
  data: TableRow[];
  columns: string[];
  link: string;

}

// Define interface for Inertia props
interface Props extends Record<string, any> {
  auth: { user: any };
  cards: CardData[];
  tab1: TableRow[];
  tab2: TableRow[];
  tab3: TableRow[];
  title1: string;
  title2: string;
  title3: string;
  link1: string;
  link2: string;
  link3: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
];

// Static fallback data
const fallbackSummaryData: SummaryItem[] = [
  { label: 'Users', value: 420, color: '#3b82f6', redirectlink: '' },
  { label: 'Backups', value: 80, color: '#10b981', redirectlink: '' },
  { label: 'Activity Logs', value: 1570, color: '#f59e0b', redirectlink: '' },
];

// Color themes for different tables
const tableThemes = [
  { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', header: 'bg-blue-500', text: 'text-blue-800', accent: 'bg-blue-200/50' },
  { bg: 'from-green-50 to-green-100', border: 'border-green-200', header: 'bg-green-500', text: 'text-green-800', accent: 'bg-green-200/50' },
  { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', header: 'bg-amber-500', text: 'text-amber-800', accent: 'bg-amber-200/50' },
];

// Helper function to format column names
const formatColumnName = (column: string): string => {
  return column
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to get column names from data
const getColumnsFromData = (data: TableRow[]): string[] => {
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]);
};

// Helper function to format cell value
const formatCellValue = (value: any, columnName?: string, colIndex?: number, tableName?: string): string => {
  if (value === null || value === undefined) return '-';

  // Check if it's a currency column (using column name for detection)
  const currencyColumns = ['balance', 'cost', 'amount', 'price', 'value', 'total_cost', 'total_amount', 'estimated_cost', 'actual_cost'];
  const isCurrencyColumn = currencyColumns.some(currencyCol =>
    columnName?.toLowerCase().includes(currencyCol)
  );

  if (typeof value === 'number') {
    if (isCurrencyColumn && value >= 1000000) {
      return `${(value / 1000000).toFixed(2)} Mn`;
    }
    return value.toLocaleString();
  }

  if (typeof value === 'string') {
    if (isCurrencyColumn) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (num >= 1000000) {
          return `${(num / 1000000).toFixed(2)} Mn`;
        }
        return `${num.toLocaleString()}`;
      }
    }
    // Capitalize first letter for the first column (skip for Funds table)
    if (colIndex === 1 && tableName !== 'Funds' && tableName !== 'Total Funds') {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    return value;
  }

  return String(value);
};

export default function Dashboard() {
  const { props } = usePage<Props>();
  const user = props.auth.user;
  const cards = props.cards || [];
  const [summaryData, setSummaryData] = useState<SummaryItem[]>(fallbackSummaryData);
  const [loading, setLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Record<number, boolean>>({});
  const [visibleRows, setVisibleRows] = useState<Record<number, number>>({ 0: 5, 1: 5, 2: 5 });

  // Dialog State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<InstituteCompletionDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // New function to handle card clicks
  const handleCardClick = async (link: string, title?: string) => {
    // Check if link is completion endpoint
    if (link && link.includes('/dashboard/completion')) {
      setDetailsLoading(true);
      setModalOpen(true);
      setSelectedDetails(null);
      try {
        const res = await axios.get(link);
        setSelectedDetails(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load details');
        setModalOpen(false);
      } finally {
        setDetailsLoading(false);
      }
    }
    // Otherwise standard navigation if redirectlink exists
    else if (link) {
      router.visit(link);
    }
  };

  // Prepare table data from props
  const tableData: TableData[] = [
    {
      title: props.title1 || 'Funds',
      data: props.tab1 || [],
      columns: getColumnsFromData(props.tab1 || []),
      link: props.link1 || '',
    },
    {
      title: props.title2 || 'Tab2',
      data: props.tab2 || [],
      columns: getColumnsFromData(props.tab2 || []),
      link: props.link2 || '',
    },
    {
      title: props.title3 || 'Tab3',
      data: props.tab3 || [],
      columns: getColumnsFromData(props.tab3 || []),
      link: props.link3 || '',
    }
  ];

  useEffect(() => {
    if (cards.length === 0) return;

    const fetchCounts = async () => {
      setLoading(true);
      try {
        const countPromises = cards.map(async (card: CardData) => {
          try {
            const response = await axios.get<{ count: number }>(card.link);
            return { label: card.title, value: response.data.count || 0, color: card.color, redirectlink: card.redirectlink };
          } catch (error) {
            console.error(`Failed to fetch count for ${card.title}:`, error);
            return { label: card.title, value: 0, color: card.color, redirectlink: card.redirectlink };
          }
        });

        const fetchedData = await Promise.all(countPromises);
        setSummaryData(fetchedData);
      } catch (error) {
        console.error('Failed to fetch summary data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [cards]);

  // Toggle show more rows
  const handleShowMore = (tableIndex: number) => {
    setVisibleRows((prev) => ({
      ...prev,
      [tableIndex]: (prev[tableIndex] || 5) + 5,
    }));
  };

  // Toggle show less rows
  const handleShowLess = (tableIndex: number) => {
    setVisibleRows((prev) => ({
      ...prev,
      [tableIndex]: Math.max(5, (prev[tableIndex] || 5) - 5),
    }));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-2 md:gap-6 sm:gap-4 p-2 md:p-5">
        {/* Hero Section */}


        <div className="relative px-2 sm:px-8 py-2 sm:py-6 text-center">
          <Card className="inline-block bg-primary/95 backdrop-blur-sm shadow-2xl border-0 max-w-3xl mx-auto mb-2 p-2 md:p-5" style={{ borderBottom: `6px solid rgba(0,0,255,0.7)` }}>
            <CardContent className=" pt-2 px-2 sm:pt-5 sm:px-10" >
              <h1 className="text-md sm:text-xl  md:text-4xl sm:font-bold font-semibold text-white">
                School Management System
              </h1>

            </CardContent>
          </Card>


        </div>


        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6">
          {(loading ? fallbackSummaryData : summaryData).map((item, index) => {
            const cardData = cards[index];
            const iconName = (cardData?.icon || ['Users', 'HardDrive', 'LogIcon'][index % 3]) as keyof typeof LucideIcons;


            return (
              <div
                key={index}
                onClick={() => {
                  // Priority: Check if api link is special (completion), otherwise use redirectlink
                  if (item.redirectlink?.includes('/dashboard/completion')) {
                    handleCardClick(item.redirectlink);
                  } else if (item.redirectlink) {
                    router.visit(item.redirectlink);
                  }
                }}
                className={item.redirectlink ? "cursor-pointer" : ""}
              >
                <Card
                  redirectLink={!item.redirectlink?.includes('/dashboard/completion') ? item.redirectlink : undefined}
                  number={loading ? '...' : (item.label === 'Funds' || item.label === 'Institutes Funds' ? `${(item.value / 1000000).toFixed(2)}Mn` : item.value)}
                  title={item.label}
                  icon={iconName}
                  iconBgColor={item.color}
                  changeColorOnHover={true}
                  className="shadow-lg p-2 md:p-5 hover:scale-110 hover:-translate-y-2 transition-all duration-300 ease-in-out active:scale-95"
                />
              </div>
            );
          })}
        </div>


        {/* Dynamic Table Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
          {tableData.map((table, index) => {
            const theme = tableThemes[index % tableThemes.length];

            return (
              <Card
                key={index}
                className={`bg-gradient-to-br ${theme.bg} ${theme.border} shadow-lg rounded-xl overflow-hidden dark:bg-gray-800 dark:border-gray-700`}
              >
                <CardHeader className={`${theme.header} text-white px-6 py-2 dark:bg-gray-700`}>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <span className="w-3 h-3 bg-white rounded-full mr-2"></span>
                    {table.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {table.data.length > 0 ? (
                    <div className="overflow-x-auto  py-3">
                      <div className="shadow-sm rounded-md overflow-hidden">
                        <table className="w-full table-fixed">
                          <thead className={`${theme.accent} dark:bg-gray-600`}>
                            <tr>
                              {table.columns.map((column, colIndex) => (
                                column !== 'Key' && (
                                  <th
                                    key={colIndex}
                                    className="text-left py-3 px-4 text-sm md:text-lg font-semibold dark:text-gray-200"
                                    style={{ color: theme.header.replace('bg-', 'text-') + '900' }}
                                  >
                                    {formatColumnName(column)}
                                  </th>
                                )
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.data.slice(0, visibleRows[index] || 5).map((row, rowIndex) => (
                              <tr
                                key={rowIndex}
                                onClick={() => {
                                  if (row.Key && table.link) {
                                    router.visit(`${table.link}${row.Key}`);
                                  }
                                }}
                                className={`border-b ${table.link ? 'cursor-pointer' : ''} ${theme.border}/30 transition-all hover:opacity-95 hover:shadow-md
                          ${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}`}
                              >
                                {table.columns.map((column, colIndex) => (
                                  column !== 'Key' && (
                                    <td key={colIndex} className={`py-3 px-4 text-sm md:text-lg ${theme.text}`}>
                                      {formatCellValue(row[column], column, colIndex, table.title)}
                                    </td>
                                  )
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Show More / Show Less Buttons */}
                      {table.data.length > 5 && (
                        <div className="p-4 text-center border-t border-gray-200 bg-gray-50 flex gap-2 justify-center">
                          {(visibleRows[index] || 5) < table.data.length && (
                            <button
                              type="button"
                              onClick={() => handleShowMore(index)}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-transparent bg-blue-500 text-white shadow-sm hover:bg-blue-600 focus:outline-none transition-colors"
                            >
                              Show More ({table.data.length - (visibleRows[index] || 5)} remaining)
                            </button>
                          )}
                          {(visibleRows[index] || 5) > 5 && (
                            <button
                              type="button"
                              onClick={() => handleShowLess(index)}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-transparent bg-gray-400 text-white shadow-sm hover:bg-gray-500 focus:outline-none transition-colors"
                            >
                              Show Less
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Completion Details: {selectedDetails?.institute || 'Loading...'}</DialogTitle>
              <DialogDescription>
                Detailed breakdown of invalid or missing criteria.
              </DialogDescription>
            </DialogHeader>

            {detailsLoading ? (
              <div className="flex justify-center p-8">Loading details...</div>
            ) : selectedDetails ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-semibold text-lg">Total Score</span>
                  <span className={`text-2xl font-bold ${selectedDetails.percentage === 100 ? 'text-green-600' :
                    selectedDetails.percentage < 50 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                    {selectedDetails.percentage}%
                  </span>
                </div>

                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Criteria</th>
                        <th className="px-4 py-3 text-right">Weight</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-left">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedDetails.criteria.map((criterion, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium">{criterion.name}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{criterion.weight}%</td>
                          <td className="px-4 py-3 text-center">
                            {criterion.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className={`px-4 py-3 ${criterion.completed ? 'text-green-600' : 'text-red-600'}`}>
                            {criterion.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Fallback/Help Text */}
                {selectedDetails.percentage < 100 && (
                  <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900">
                    Note: Please address the items marked with <XCircle className="w-3 h-3 inline text-red-500" /> to reach 100% completion.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-red-500">Failed to load details.</div>
            )}
          </DialogContent>
        </Dialog>
        {/* Optional: Display raw data for debugging */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {tableData.map((table, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-bold mb-2">{table.title} Data Structure</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(table, null, 2)}
              </pre>
            </Card>
          ))}
        </div> */}
      </div>
    </AppLayout>
  );
}