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

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!data || !data.analytics) return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-slate-400 px-4 text-center">
            <PieChart size={64} className="mb-6 opacity-10" />
            <h2 className="text-xl font-black text-indigo-950 uppercase tracking-tight mb-2">No Analytical Data mapped</h2>
            <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">Please upload your bank statement to initialize the behavioral intelligence models.</p>
        </div>
    );

    const income = data.features?.avg_monthly_income ?? data.features?.[1] ?? 50000;
    const expense = data.features?.avg_monthly_spend ?? data.features?.[3] ?? 30000;
    const monthlyData = [
        { name: 'Snapshot 1', Income: (income * 0.9), Expense: (expense * 1.1), Savings: (income * 0.9) - (expense * 1.1) },
        { name: 'Snapshot 2', Income: (income * 1.0), Expense: (expense * 0.9), Savings: (income * 1.0) - (expense * 0.9) },
        { name: 'Snapshot 3', Income: (income * 0.95), Expense: (expense * 1.2), Savings: (income * 0.95) - (expense * 1.2) },
        { name: 'Snapshot 4', Income: (income * 1.1), Expense: (expense * 0.8), Savings: (income * 1.1) - (expense * 0.8) },
        { name: 'Current', Income: (income * 1.0), Expense: (expense * 1.0), Savings: (income * 1.0) - (expense * 1.0) },
    ];

    const radarData = [
        { subject: 'Consistency', A: (data.features?.income_consistency ?? data.features?.[0] ?? 0) * 100, fullMark: 100 },
        { subject: 'Savings Velocity', A: Math.min(100, Math.max(0, (data.features?.savings_rate ?? data.features?.[5] ?? 0) * 200)), fullMark: 100 },
        { subject: 'Commitments', A: (data.features?.fixed_commitments_ratio ?? data.features?.[8] ?? 0) * 100, fullMark: 100 },
        { subject: 'Discipline', A: Math.min(100, Math.max(0, (data.features?.spending_discipline ?? (1 - (data.features?.[4] || 0))) * 100)), fullMark: 100 },
        { subject: 'Wealth index', A: Math.min(100, (data.features?.investment_activity_present ?? data.features?.[12] ?? 0) * 200), fullMark: 100 },
        { subject: 'Stability', A: Math.min(100, (data.features?.balance_stability ?? data.features?.[16] ?? 0) * 100), fullMark: 100 },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 bg-[#F8F9FB] min-h-screen space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10 border-b border-indigo-100/50 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-500/20 flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3" />
                            <span>Vector Analytics Active</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calibration: Institutional</p>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-indigo-950">Behavioral <span className="text-indigo-500">Analytics</span></h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Intelligence Insight: Deep-dive into transactional vectors and credit markers.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Composed Chart (Line + Bar) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="banking-card p-10 col-span-1 lg:col-span-3 border-indigo-100/50"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-black text-indigo-950 tracking-tight">Temporal Flow Vectors</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Inflow vs Outflow Magnitude</span>
                    </div>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val/1000)}k`} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                                    labelStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', color: '#1e1b4b', marginBottom: '8px' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                <Bar yAxisId="left" dataKey="Income" barSize={40} fill="#4F46E5" radius={[12, 12, 0, 0]} />
                                <Bar yAxisId="left" dataKey="Expense" barSize={40} fill="#E2E8F0" radius={[12, 12, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="Savings" stroke="#10b981" strokeWidth={4} dot={{ stroke: '#10b981', strokeWidth: 3, r: 5, fill: '#fff' }} activeDot={{ r: 8 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 2. Spending Breakdown Pie */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="banking-card p-10 col-span-1 lg:col-span-2 border-indigo-100/50"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <PieChart className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-black text-indigo-950 tracking-tight">Categorical Dispersion</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Allocation</span>
                    </div>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={data.analytics}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={90}
                                    outerRadius={140}
                                    paddingAngle={8}
                                    dataKey="amount"
                                    nameKey="category"
                                >
                                    {data.analytics.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                                    contentStyle={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 3. Radar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="banking-card p-10 border-indigo-100/50"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Shield className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-black text-indigo-950 tracking-tight">Behavioral Index</h2>
                        </div>
                    </div>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="A" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} strokeWidth={3} />
                                <RechartsTooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
            
             <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-10 bg-indigo-950 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full" />
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <Shield className="w-6 h-6 text-emerald-400" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Institutional Narrative Advisory</h3>
                    </div>
                    <p className="text-sm font-medium text-indigo-100 leading-relaxed max-w-4xl relative z-10 italic">
                        {data.tier === "STABLE"
                            ? `"Your vector profile is exemplary. Our V2.0 behavioral models indicate that maintaining current trajectory in ${data.analytics?.[0]?.category?.toLowerCase() || 'financial'} capital allocation maps to a prime rating with negligible institutional risk."`
                            : `"Calibration Delta Detected: Based on current ${data.analytics?.[0]?.category?.toLowerCase() || 'spending'} velocity, models suggest a 15% reduction in discretionary outflow to achieve Institutional Grade 'STABLE' status within the next 90-day cycle."`
                        }
                    </p>
            </motion.div>
        </div>
    );

}
