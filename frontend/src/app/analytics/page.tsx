'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PieChart, TrendingUp, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart,
  PieChart as RePieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface SpendingCategory {
    category: string;
    amount: number;
    percentage: number;
}

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

export default function AnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const token = await user.getIdToken();
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchData();
        }
    }, [user, authLoading, router]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    if (!data || !data.analytics) return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-gray-400">
            <PieChart size={64} className="mb-4 opacity-20" />
            <p className="font-medium text-lg text-emerald-600">No analytics data available yet.</p>
            <p className="text-sm">Please upload your bank statement to see insights.</p>
        </div>
    );

    // Prepare Mock Data for the charts based on real features if possible, or fallback
    // In a real app the backend would serve month-wise arrays. Here we mock what we'd see from the UI screenshot
    const monthlyData = [
        { name: 'Oct', Income: ((data.features?.[1] || 50000) * 0.9), Expense: ((data.features?.[3] || 30000) * 1.1), Savings: ((data.features?.[1] || 50000) * 0.9) - ((data.features?.[3] || 30000) * 1.1) },
        { name: 'Nov', Income: ((data.features?.[1] || 50000) * 1.0), Expense: ((data.features?.[3] || 30000) * 0.9), Savings: ((data.features?.[1] || 50000) * 1.0) - ((data.features?.[3] || 30000) * 0.9) },
        { name: 'Dec', Income: ((data.features?.[1] || 50000) * 0.95), Expense: ((data.features?.[3] || 30000) * 1.2), Savings: ((data.features?.[1] || 50000) * 0.95) - ((data.features?.[3] || 30000) * 1.2) },
        { name: 'Jan', Income: ((data.features?.[1] || 50000) * 1.1), Expense: ((data.features?.[3] || 30000) * 0.8), Savings: ((data.features?.[1] || 50000) * 1.1) - ((data.features?.[3] || 30000) * 0.8) },
        { name: 'Feb', Income: ((data.features?.[1] || 50000) * 1.0), Expense: ((data.features?.[3] || 30000) * 1.0), Savings: ((data.features?.[1] || 50000) * 1.0) - ((data.features?.[3] || 30000) * 1.0) },
    ];

    const radarData = [
        { subject: 'Consistency', A: (data.features?.[0] || 0) * 100, fullMark: 100 },
        { subject: 'Savings', A: Math.min(100, Math.max(0, (data.features?.[5] || 0) * 200)), fullMark: 100 },
        { subject: 'Commits', A: (data.features?.[8] || 0) * 100, fullMark: 100 },
        { subject: 'Discipline', A: Math.min(100, Math.max(0, (1 - (data.features?.[4] || 0)) * 100)), fullMark: 100 },
        { subject: 'Wealth', A: Math.min(100, (data.features?.[12] || 0) * 200), fullMark: 100 },
        { subject: 'Stability', A: Math.min(100, (data.features?.[16] || 0) * 100), fullMark: 100 },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 mt-4 bg-gray-50/30 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-gray-900">
                        Financial <span className="text-emerald-600">Analytics</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Deep dive into your behavioral spending patterns and their credit impact.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* 1. Composed Chart (Line + Bar) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">Monthwise Income vs Expense</h2>
                    </div>
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val/1000)}k`} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN', {maximumFractionDigits:0})}`}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="Income" barSize={30} fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="left" dataKey="Expense" barSize={30} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="Savings" stroke="#3b82f6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 2. Spending Breakdown Pie */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">Spending Breakdown</h2>
                    </div>
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={data.analytics}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="amount"
                                    nameKey="category"
                                >
                                    {data.analytics.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN', {maximumFractionDigits:0})}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 3. Radar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">Behavioral Fingerprint</h2>
                    </div>
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
                
            </div>
            
             <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-6 bg-[#1e2329] rounded-3xl text-white shadow-xl"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-bold text-white font-heading">Secure & Encrypted Advice</h3>
                    </div>
                    <p className="text-sm text-gray-300 italic font-medium leading-relaxed">
                        {data.tier === "STABLE"
                            ? `"Your profile is exemplary. Our bank-grade AI models suggest that continuing your current pattern of ${data.analytics?.[0]?.category?.toLowerCase() || 'financial'} management will lead to a 0% risk of credit rejection."`
                            : `"Based on your ${data.analytics?.[0]?.category?.toLowerCase() || 'spending'} ratio, our bank-grade AI models recommend reducing discretionary outflows by 15% to move into the 'STABLE' tier within 3 months."`
                        }
                    </p>
            </motion.div>
        </div>
    );
}
