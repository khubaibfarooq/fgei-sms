import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- Colors ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- Types ---
interface ChartProps {
    data: any[];
    title?: string;
    className?: string;
}

// --- Hook for Responsive Config ---
const useChartConfig = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return {
        fontSize: isMobile ? 10 : 12,
        headerSize: isMobile ? 12 : 14,
        axisProps: {
            tick: { fontSize: isMobile ? 10 : 12 },
            label: { fontSize: isMobile ? 10 : 12 },
        },
        legendProps: {
            wrapperStyle: { fontSize: isMobile ? 10 : 12, paddingTop: '10px' }
        },
        tooltipStyle: {
            fontSize: isMobile ? 11 : 13
        },
        isMobile
    };
};

// --- 1. Funds Pie Chart (School/College/Directorate) ---
// Expected Data: { Head: string, balance: number }
export const FundsPieChart = ({ data }: ChartProps) => {
    const { fontSize, legendProps, isMobile } = useChartConfig();
    if (!data || data.length === 0) return <div className="text-center p-4 text-gray-500">No Data</div>;

    const formattedData = data.map(item => ({
        ...item,
        balance: Number(item.balance)
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={formattedData}
                    dataKey="balance"
                    nameKey="Head"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    label={!isMobile ? (entry) => entry.Head : undefined}
                    labelLine={!isMobile}
                >
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rs ${value.toLocaleString()}`} contentStyle={{ fontSize }} />
                <Legend {...legendProps} />
            </PieChart>
        </ResponsiveContainer>
    );
};

// --- 2. Projects Bar Chart (School/College - Count) ---
// Expected Data: { status: string, project_count: number }
export const ProjectsCountChart = ({ data }: ChartProps) => {
    const { axisProps, fontSize } = useChartConfig();
    if (!data || data.length === 0) return <div className="text-center p-4 text-gray-500">No Data</div>;

    const formattedData = data.map(item => ({
        ...item,
        project_count: Number(item.project_count)
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="status" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={{ fontSize }} />
                <Bar dataKey="project_count" name="Count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

// --- 3. Assets Bar Chart (School/College) ---
// Expected Data: { Category: string, total_assets: number }
export const AssetsBarChart = ({ data }: ChartProps) => {
    const { axisProps, fontSize, isMobile } = useChartConfig();
    if (!data || data.length === 0) return <div className="text-center p-4 text-gray-500">No Data</div>;

    const formattedData = data.map(item => ({
        ...item,
        total_assets: Number(item.total_assets)
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} layout="vertical" margin={{ top: 20, right: 30, left: isMobile ? 10 : 40, bottom: 5 }}>
                <XAxis type="number" {...axisProps} />
                <YAxis dataKey="Category" type="category" width={isMobile ? 80 : 100} {...axisProps} tick={{ fontSize: isMobile ? 9 : 11 }} />
                <Tooltip contentStyle={{ fontSize }} />
                <Bar dataKey="total_assets" name="Assets" fill="#82ca9d" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

// --- 4. Institute Donut Chart (Regional) ---
// Expected Data: { type: string, institute_count: number }
export const InstituteDonutChart = ({ data }: ChartProps) => {
    const { fontSize, legendProps, isMobile } = useChartConfig();
    if (!data || data.length === 0) return <div className="text-center p-4 text-gray-500">No Data</div>;

    const formattedData = data.map(item => ({
        ...item,
        institute_count: Number(item.institute_count)
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={formattedData}
                    dataKey="institute_count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 60 : 80}
                    paddingAngle={5}
                    label={!isMobile}
                >
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize }} />
                <Legend {...legendProps} />
            </PieChart>
        </ResponsiveContainer>
    );
};

// --- 5. Projects Cost Comparison Stacked Chart (Regional/Directorate) ---
// Expected Data: { status: string, estimated_cost: number, actual_cost: number }
export const ProjectsCostChart = ({ data }: ChartProps) => {
    const { axisProps, fontSize, legendProps } = useChartConfig();
    if (!data || data.length === 0) return <div className="text-center p-4 text-gray-500">No Data</div>;

    const formattedData = data.map(item => ({
        ...item,
        estimated_cost: Number(item.estimated_cost),
        actual_cost: Number(item.actual_cost)
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="status" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ fontSize }} formatter={(value: number) => `${(value / 1000000).toFixed(2)} Mn`} />
                <Legend {...legendProps} />
                <Bar dataKey="estimated_cost" name="Est. Cost" fill="#8884d8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual_cost" name="Actual Cost" fill="#82ca9d" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

// --- 6. Generic Distribution Pie Chart (Admin Users / Generic) ---
// Expected Data: { type: string, user_count: number } OR generic
export const DistributionPieChart = ({ data, nameKey = "type", valueKey = "user_count" }: ChartProps & { nameKey?: string, valueKey?: string }) => {
    const { fontSize, legendProps, isMobile } = useChartConfig();
    if (!data || data.length === 0) return <div className="text-center p-4 text-gray-500">No Data</div>;

    const formattedData = data.map(item => ({
        ...item,
        [valueKey]: Number(item[valueKey])
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={formattedData}
                    dataKey={valueKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    label={!isMobile}
                >
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize }} />
                <Legend {...legendProps} />
            </PieChart>
        </ResponsiveContainer>
    );
};

// --- 7. Task Status Bar Chart (Admin) ---
// Expected Data: { status: string, total_request: number }
export const TaskStatusChart = ({ data }: ChartProps) => {
    const { axisProps, fontSize } = useChartConfig();
    if (!data || data.length === 0) return <div className="text-center p-4 text-gray-500">No Data</div>;

    const formattedData = data.map(item => ({
        ...item,
        total_request: Number(item.total_request)
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="status" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip contentStyle={{ fontSize }} />
                <Bar dataKey="total_request" name="Requests" fill="#FF8042" radius={[4, 4, 0, 0]}>
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

// --- 8. Regional Funds Bar Chart ---
// Expected Data: { Head: string, balance: number }
export const RegionalFundsChart = ({ data }: ChartProps) => {
    const { axisProps, fontSize } = useChartConfig();
    if (!data || data.length === 0) return <div className="text-center p-4 text-gray-500">No Data</div>;

    const formattedData = data.map(item => ({
        ...item,
        balance: Number(item.balance)
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <XAxis dataKey="Head" interval={0} angle={-45} textAnchor="end" height={60} {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ fontSize }} formatter={(value: number) => `${(value / 1000000).toFixed(2)} Mn`} />
                <Bar dataKey="balance" name="Balance" fill="#82ca9d" radius={[4, 4, 0, 0]}>
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
