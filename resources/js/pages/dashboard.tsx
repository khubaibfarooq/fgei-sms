import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import axios from 'axios';
import { iconMapper } from '@/lib/iconMapper';
import type { LucideIcon } from 'lucide-react';

// Define interface for card data from props.cards
interface CardData {
  id: number;
  title: string;
  link: string;
  color: string;
  role_id: number;
  created_at: string;
  updated_at: string;
}

// Define interface for summaryData items
interface SummaryItem {
  label: string;
  value: number;
  color: string;
}

// Define interfaces for table data
interface TableRow {
  [key: string]: any;
}

interface TableData {
  title: string;
  data: TableRow[];
  columns: string[];
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
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
];

// Static fallback data
const fallbackSummaryData: SummaryItem[] = [
  { label: 'Users', value: 420, color: '#3b82f6' },
  { label: 'Backups', value: 80, color: '#10b981' },
  { label: 'Activity Logs', value: 1570, color: '#f59e0b' },
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
const formatCellValue = (value: any, columnName?: string): string => {
  if (value === null || value === undefined) return '-';
  
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  if (typeof value === 'string') {
    // Check if it's a currency value (using column name for better detection)
    const currencyColumns = ['balance', 'cost', 'amount', 'price', 'value', 'total_cost', 'total_amount'];
    const isCurrencyColumn = currencyColumns.some(currencyCol => 
      columnName?.toLowerCase().includes(currencyCol)
    );
    
    if (isCurrencyColumn) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return `$${num.toLocaleString()}`;
      }
    }
        return value;

    // Capitalize first letter of the string
    //return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
  
  return String(value);
};

export default function Dashboard() {
  const { props } = usePage<Props>();
  const user = props.auth.user;
  const cards = props.cards || [];
  const [summaryData, setSummaryData] = useState<SummaryItem[]>(fallbackSummaryData);
  const [loading, setLoading] = useState(false);

  // Prepare table data from props
  const tableData: TableData[] = [
    {
      title: props.title1 || 'Funds',
      data: props.tab1 || [],
      columns: getColumnsFromData(props.tab1 || [])
    },
    {
      title: props.title2 || 'Tab2', 
      data: props.tab2 || [],
      columns: getColumnsFromData(props.tab2 || [])
    },
    {
      title: props.title3 || 'Tab3',
      data: props.tab3 || [],
      columns: getColumnsFromData(props.tab3 || [])
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
            return { label: card.title, value: response.data.count || 0, color: card.color };
          } catch (error) {
            console.error(`Failed to fetch count for ${card.title}:`, error);
            return { label: card.title, value: 0, color: card.color };
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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-6 p-2">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-green-600 to-green-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-8 py-12 text-center">
            <Card className="inline-block bg-white/95 backdrop-blur-sm shadow-2xl border-0 max-w-3xl mx-auto mb-2"     style={{ borderBottom: `6px solid rgba(0,0,255,0.7)`}}>
              <CardContent className="p-4" >
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 ">
                  School Management System
                </h1>
             
              </CardContent>
            </Card>
               <p className="text-lg text-white mb-2">
                  Welcome back, {user?.name || 'Administrator'}
                </p>
             
          </div>
        </div>

        {/* Summary Cards */}
       <div className="flex flex-wrap justify-center gap-6">
  {(loading ? fallbackSummaryData : summaryData).map((item, index) => (
    <div className="w-full sm:w-64 md:w-56 lg:w-64" key={index}>
      <Card 
        className="shadow-lg rounded-xl border-0 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 h-full"
        style={{ 
          background: `linear-gradient(135deg, ${item.color}20, ${item.color}40)`,
          borderLeft: `4px solid ${item.color}`
        }}
      >
        <CardHeader className="px-6 py-4 pb-2">
          <CardTitle className="text-lg font-semibold text-gray-700 dark:text-white text-center">
            {item.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-4 pt-2">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
            {loading ? '...' : item.value}
          </div>
        </CardContent>
      </Card>
    </div>
  ))}
</div>

        {/* Dynamic Table Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tableData.map((table, index) => {
            const theme = tableThemes[index % tableThemes.length];
            
            return (
              <Card 
                key={index}
                className={`bg-gradient-to-br ${theme.bg} ${theme.border} shadow-lg rounded-xl overflow-hidden`}
              >
                <CardHeader className={`${theme.header} text-white px-6 py-4`}>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <span className="w-3 h-3 bg-white rounded-full mr-2"></span>
                    {table.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {table.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={theme.accent}>
                          <tr>
                            {table.columns.map((column, colIndex) => (
                              <th 
                                key={colIndex} 
                                className="text-left py-3 px-4 text-sm font-medium"
                                style={{ color: theme.header.replace('bg-', 'text-') + '900' }}
                              >
                                {formatColumnName(column)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.data.map((row, rowIndex) => (
                            <tr 
                              key={rowIndex} 
                              className={`border-b ${theme.border}/30 hover:${theme.bg.replace('from-', 'bg-').split(' ')[0]}/50 transition-colors`}
                            >
                              {table.columns.map((column, colIndex) => (
                                <td 
                                  key={colIndex} 
                                  className={`py-3 px-4 text-sm ${theme.text}`}
                                >
                                  {formatCellValue(row[column])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

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