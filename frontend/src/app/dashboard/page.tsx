"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import ScoreGauge from "@/components/ScoreGauge";
import AIInsights from "@/components/AIInsights";
import SimulationWidget from "@/components/SimulationWidget";
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
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#F8F9FB] min-h-screen">
            {/* Professional Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10 border-b border-indigo-100/50 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            <span>Verified Institutional Rating</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Snapshot: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-indigo-950">Financial Intelligence <span className="text-indigo-500">Report</span></h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        System Authority: <span className="text-indigo-600">Crediscout V2.0 Engine</span>
                        <span className="text-slate-300">•</span>
                        Node Index: <span className="text-slate-800">{data.id.slice(0, 8).toUpperCase()}</span>
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchData}
                        className="p-3 rounded-2xl border border-indigo-100 bg-white hover:bg-slate-50 transition-all shadow-sm group active:scale-95"
                        title="Re-synchronize Data"
                    >
                        <RefreshCw className="w-4 h-4 text-indigo-600 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                    <button
                        onClick={handleDownloadCertificate}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <FileDown className="w-4 h-4" />
                        <span>Export Certificate</span>
                    </button>
                </div>
            </div>

            {/* Top Row: Score & Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Overview */}
                <div className="col-span-1 banking-card p-10 flex flex-col items-center justify-center relative overflow-hidden group border-indigo-100/50">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 blur-3xl group-hover:bg-indigo-100/40 transition-colors" />
                    <ScoreGauge score={data.score} tier={data.tier} />
                    <div className="mt-6 px-6 py-2 rounded-2xl text-[10px] font-black tracking-[0.25em] bg-indigo-950 text-white uppercase shadow-lg">
                        {data.tier} GRADE
                    </div>
                    <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Calibration Active</p>
                </div>

                {/* Financial Snapshot */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Monthly Inflow', value: `₹${(data.features?.avg_monthly_income ?? data.features?.[1] ?? 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100/50' },
                        { label: 'Monthly Outflow', value: `₹${(data.features?.avg_monthly_spend ?? data.features?.[3] ?? 0).toLocaleString('en-IN')}`, icon: LayoutDashboard, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100/50' },
                        { label: 'Net Retention', value: `₹${(data.features?.avg_monthly_savings ?? ((data.features?.[1] || 0) - (data.features?.[3] || 0))).toLocaleString('en-IN')}`, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100/50' },
                        { label: 'Savings Velocity', value: `${((data.features?.savings_rate ?? data.features?.[5] ?? 0) * 100).toFixed(1)}%`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100/50' },
                    ].map((card, idx) => (
                        <div key={idx} className={`bg-white p-6 rounded-3xl border ${card.border} shadow-sm flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-500/5 transition-all hover:-translate-y-1`}>
                            <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center mb-6`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div>
                                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</h4>
                                <p className="text-2xl font-black text-indigo-950 tracking-tighter">{card.value}</p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Score Trend Mini */}
                     <div className="col-span-2 md:col-span-4 bg-white p-8 rounded-3xl border border-indigo-500/5 shadow-sm flex flex-col hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Historical Trajectory</h3>
                            </div>
                            <Link href="/analytics" className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-black tracking-widest uppercase bg-indigo-50 px-3 py-1 rounded-full transition-colors">
                                Detailed Analysis <ChevronRight size={12} />
                            </Link>
                        </div>
                        <div className="flex-1 w-full min-h-[120px] opacity-80">
                            <ScoreTrendLine history={history} />
                        </div>
                    </div>
                </div>
            </div>

             {/* Middle Row: Score Components & Loan Eligibility */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Score Components */}
                <div className="banking-card p-10 border-indigo-100/50">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <Shield className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-black text-indigo-950 tracking-tight">Component Rationale</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weighted Impacts</span>
                    </div>
                    
                    <div className="space-y-8">
                        {data.score_components ? data.score_components.map((comp: any, idx: number) => (
                            <div key={idx} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-black text-indigo-900 uppercase tracking-tight">{comp.name}</span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${comp.impact > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                        {comp.impact > 0 ? `+${comp.impact}` : comp.impact} PTS
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{comp.description}</p>
                            </div>
                        )) : (
                            <div className="text-sm text-slate-400 italic">Analytical components localized.</div>
                        )}
                    </div>
                </div>

                {/* Loan Eligibility */}
                <div className="banking-card p-10 border-indigo-100/50">
                     <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <BarChart className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-black text-indigo-950 tracking-tight">Eligibility Matrix</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Probability Scale</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {(data.loan_eligibility || []).map((loan: any, idx: number) => {
                            const isEligible = loan.status === 'Eligible' || loan.status === 'Check Quotes' || String(loan.status).includes('High');
                            return (
                                <div key={idx} className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 ${isEligible ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-500/5' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-black text-indigo-950 text-xs uppercase tracking-widest">{loan.type}</span>
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black ${isEligible ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {isEligible ? 'A+' : 'N/A'}
                                        </div>
                                    </div>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-2 ${isEligible ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {loan.status}
                                    </p>
                                    <p className={`text-sm font-black tracking-tight ${isEligible ? 'text-indigo-900' : 'text-slate-500'}`}>
                                        {loan.estimate}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Row: AI Insights & Transaction History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                <div className="col-span-1 bg-gradient-to-br from-indigo-900 to-indigo-950 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
                     <div className="flex items-center gap-3 mb-10 relative z-10">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                            <Zap className="w-5 h-5 text-indigo-300" />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight">Behavioral Insights</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        <AIInsights insights={data.financial_insights || data.insights || []} />
                    </div>
                </div>

                <div className="col-span-1 bg-white p-10 rounded-[2.5rem] border border-indigo-500/5 shadow-sm flex flex-col">
                     <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-xl">
                                <List className="w-5 h-5 text-slate-600" />
                            </div>
                            <h2 className="text-xl font-black text-indigo-950 tracking-tight">Audit Trail</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
                    </div>
                    
                    <div className="flex-1 overflow-x-auto">
                        {(!data.transactions || data.transactions.length === 0) ? (
                            <div className="text-center py-10 text-slate-400">
                                <List className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                                <p className="font-bold text-xs uppercase tracking-widest">No activity mapped</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-indigo-50/50">
                                        <th className="pb-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Value Date</th>
                                        <th className="pb-4 text-slate-400 font-bold uppercase tracking-widest text-[9px]">Description</th>
                                        <th className="pb-4 text-slate-400 font-bold uppercase tracking-widest text-[9px] text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-indigo-50/30">
                                    {data.transactions.slice(0, 5).map((tx: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">{tx.date}</td>
                                            <td className="py-4 font-bold text-indigo-900 text-xs truncate max-w-[120px]">{tx.description}</td>
                                            <td className={`py-4 font-black text-xs text-right tracking-tight ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-indigo-950'}`}>
                                                {tx.type === 'CREDIT' ? '+' : '-'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-indigo-50/50 flex justify-end">
                       <Link href="/clean_transactions" className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-[0.15em] bg-indigo-50 px-3 py-1.5 rounded-full transition-colors">
                           Master Ledger <ChevronRight size={14} />
                       </Link>
                    </div>
                </div>

                <div className="col-span-1 flex flex-col h-full">
                    <SimulationWidget scoreId={data.id} currentScore={data.score} />
                </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="py-10 border-t border-indigo-100 flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center gap-6 text-slate-300">
                    <Shield size={14} />
                    <span className="text-slate-300">|</span>
                    <BarChart size={14} />
                    <span className="text-slate-300">|</span>
                    <BarChart size={14} />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center max-w-xl leading-relaxed">
                    Institutional Disclosure: This intelligence report is generated using proprietary Crediscout algorithms. 
                    All financial data is processed under strict 256-bit encryption. Ratings are behavioral estimates and do not 
                    guarantee credit approval from third-party banking entities.
                </p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">© 2026 CREDISCOUT INSTITUTIONAL SERVICES</p>
            </div>
        </div>
    );

}
