"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import ScoreGauge from "@/components/ScoreGauge";
import AIInsights from "@/components/AIInsights";
import axios from "axios";
import { FileDown, RefreshCw, AlertCircle, Loader2, LayoutDashboard, TrendingUp, ChevronRight, Shield, List } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const [dashRes, historyRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/scores`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setData(dashRes.data);
            setHistory(historyRes.data);
        } catch (err: any) {
            setError("Failed to fetch dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        } else if (user) {
            fetchData();
        }
    }, [user, authLoading]);

    const handleDownloadCertificate = async () => {
        if (!data?.id || !user) return;
        try {
            const token = await user.getIdToken();
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/certificate/${data.id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `crediscout_certificate_${data.id}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            alert("Failed to download certificate.");
        }
    };

    const ScoreTrendLine = ({ history }: { history: any[] }) => {
        if (history.length < 2) return (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                Need more snapshots to show trend.
            </div>
        );

        const points = history.slice(-8).map((s, i) => {
            const x = (i / (Math.min(history.length, 8) - 1)) * 100;
            const y = 40 - (s.score / 100) * 40;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg viewBox="0 0 100 40" className="w-full h-full">
                <defs>
                    <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path d={`M 0,40 L ${points} L 100,40 Z`} fill="url(#line-grad)" />
                <polyline points={points} fill="none" stroke="#1E3A5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {history.slice(-8).map((s, i) => {
                    const x = (i / (Math.min(history.length, 8) - 1)) * 100;
                    const y = 40 - (s.score / 100) * 40;
                    return (
                        <circle key={i} cx={x} cy={y} r="1.5" fill="#1E3A5F" />
                    );
                })}
            </svg>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Synchronizing financial signals...</p>
            </div>
        );
    }

    if (!data || data.message === "No scores found") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] space-y-6 text-center px-4">
                <div className="p-4 bg-muted rounded-full">
                    {error ? <AlertCircle className="w-12 h-12 text-error" /> : <AlertCircle className="w-12 h-12 text-muted-foreground" />}
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-primary">{error ? "Fetch Error" : "No Data Found"}</h2>
                    <p className="text-muted-foreground max-w-sm font-medium">
                        {error || "You haven't uploaded any bank statements yet. Let's analyze your transactions to generate your first score."}
                    </p>
                </div>
                <button
                    onClick={error ? fetchData : () => router.push("/upload")}
                    className="banking-button-primary px-8 py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
                >
                    {error ? "Retry Connection" : "Analyze Now"}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-gray-50/30 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-sm font-medium text-gray-500 mt-1">NODE_ID: {data.id.slice(0, 8)}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchData}
                        className="p-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4 text-emerald-600" />
                    </button>
                    <button
                        onClick={handleDownloadCertificate}
                        className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <FileDown className="w-4 h-4" />
                        <span>Download Report</span>
                    </button>
                </div>
            </div>

            {/* Top Row: Score & Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Overview */}
                <div className="col-span-1 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 blur-3xl group-hover:bg-emerald-100 transition-colors" />
                    <ScoreGauge score={data.score} tier={data.tier} />
                    <div className="mt-4 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest bg-emerald-50 text-emerald-700 uppercase border border-emerald-100">
                        {data.tier}
                    </div>
                </div>

                {/* Financial Snapshot */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Avg Monthly Income', value: `₹${(data.features?.[1] || 0).toLocaleString('en-IN', {maximumFractionDigits:0})}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Avg Monthly Spend', value: `₹${(data.features?.[3] || 0).toLocaleString('en-IN', {maximumFractionDigits:0})}`, icon: LayoutDashboard, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Monthly Savings', value: `₹${((data.features?.[1] || 0) - (data.features?.[3] || 0)).toLocaleString('en-IN', {maximumFractionDigits:0})}`, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Savings Rate', value: `${((data.features?.[5] || 0) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    ].map((card, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            <div>
                                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{card.label}</h4>
                                <p className="text-2xl font-black text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Score Trend Mini */}
                     <div className="col-span-2 md:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Score History</h3>
                            <Link href="/analytics" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold">
                                FULL ANALYTICS <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="flex-1 w-full min-h-[100px]">
                            <ScoreTrendLine history={history} />
                        </div>
                    </div>
                </div>
            </div>

             {/* Middle Row: Score Components & Loan Eligibility */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Score Components */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">Score Components</h2>
                    </div>
                    
                    <div className="space-y-6">
                        {[
                            { name: 'Payment Behavior', val: (data.features?.[8] || 0) * 100, color: 'bg-emerald-500' },
                            { name: 'Income Stability', val: (data.features?.[0] || 0) * 100, color: 'bg-blue-500' },
                            { name: 'Savings & Cushion', val: Math.min(100, Math.max(0, (data.features?.[5] || 0) * 200)), color: 'bg-indigo-500' },
                            { name: 'Spending Discipline', val: Math.min(100, Math.max(0, (1 - (data.features?.[4] || 0)) * 100)), color: 'bg-amber-500' }
                        ].map((comp, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-gray-700">{comp.name}</span>
                                    <span className="text-gray-900">{comp.val.toFixed(0)}/100</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${comp.val}%` }}
                                        transition={{ duration: 1, delay: 0.2 * idx }}
                                        className={`h-full ${comp.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loan Eligibility */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                     <div className="flex items-center gap-2 mb-8">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">Loan Eligibility</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { name: 'Home Loan', eligible: data.score > 650, amount: 'Up to ₹50L' },
                            { name: 'Personal Loan', eligible: data.score > 500, amount: 'Up to ₹5L' },
                            { name: 'Car Loan', eligible: data.score > 550, amount: 'Up to ₹10L' },
                            { name: 'Credit Card', eligible: data.score > 600, amount: 'Pre-approved' },
                        ].map((loan, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border ${loan.eligible ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-gray-900">{loan.name}</span>
                                    {loan.eligible ? 
                                        <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">✓</div> : 
                                        <div className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs">✕</div>
                                    }
                                </div>
                                <p className={`text-sm font-medium ${loan.eligible ? 'text-emerald-700' : 'text-gray-500'}`}>
                                    {loan.eligible ? loan.amount : 'Not Eligible Yet'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: AI Insights & Transaction History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                <div className="bg-[#1e2329] p-8 rounded-3xl shadow-xl text-white">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-emerald-400 rounded-full"></div>
                        <h2 className="text-xl font-bold text-white">AI Financial Insights</h2>
                    </div>
                    <AIInsights insights={data.insights} />
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-6 bg-blue-400 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                    </div>
                    
                    <div className="flex-1 overflow-x-auto">
                        {(!data.transactions || data.transactions.length === 0) ? (
                            <div className="text-center py-10 text-gray-500">
                                <List className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="font-medium">No recent transactions available</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="pb-3 text-gray-500 font-bold uppercase tracking-wider text-xs">Date</th>
                                        <th className="pb-3 text-gray-500 font-bold uppercase tracking-wider text-xs">Description</th>
                                        <th className="pb-3 text-gray-500 font-bold uppercase tracking-wider text-xs text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.transactions.slice(0, 5).map((tx: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 text-gray-500 whitespace-nowrap">{tx.date}</td>
                                            <td className="py-3 font-medium text-gray-800 line-clamp-1 max-w-[150px]">{tx.description}</td>
                                            <td className={`py-3 font-bold text-right ${tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-gray-900'}`}>
                                                {tx.type === 'CREDIT' ? '+' : '-'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                       <Link href="/clean_transactions" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                           View Full History <ChevronRight size={16} />
                       </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
