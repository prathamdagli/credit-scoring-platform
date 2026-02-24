"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";
import ScoreGauge from "@/components/ScoreGauge";
import AIInsights from "@/components/AIInsights";
import axios from "axios";
import { FileDown, RefreshCw, AlertCircle, Loader2, LayoutDashboard, TrendingUp, ChevronRight, Shield } from "lucide-react";
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
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">Credibility <span className="text-secondary">Center</span></h1>
                        <p className="text-xs text-muted-foreground font-mono font-bold tracking-tight">NODE_ID: {data.id.slice(0, 8)}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={fetchData}
                        className="p-3 rounded-xl border border-border bg-white hover:bg-muted transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-5 h-5 text-primary" />
                    </button>
                    <button
                        onClick={handleDownloadCertificate}
                        className="flex items-center space-x-2 banking-button-primary px-5 py-3 rounded-xl font-bold text-sm"
                    >
                        <FileDown className="w-4 h-4" />
                        <span>Download Report</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Score Overview */}
                <div className="lg:col-span-1 p-8 banking-card flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
                    <ScoreGauge score={data.score} tier={data.tier} />
                    <div className="mt-4 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest border border-secondary/20 bg-secondary/10 text-secondary uppercase">
                        Current Tier: {data.tier}
                    </div>
                </div>

                {/* Score Trend */}
                <div className="lg:col-span-3 p-8 banking-card flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Score Momentum</h3>
                        </div>
                        <Link href="/analytics" className="text-xs text-primary hover:underline flex items-center gap-1 font-bold">
                            FULL ANALYTICS <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="flex-1 w-full min-h-[160px]">
                        <ScoreTrendLine history={history} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AIInsights insights={data.insights} />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="p-8 bg-primary text-primary-foreground rounded-3xl relative overflow-hidden shadow-lg shadow-primary/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl" />
                        <h3 className="text-xl font-bold mb-3 tracking-tight">
                            {data.tier === "STABLE" ? "Performance Peak" : "Next Milestone"}
                        </h3>
                        <p className="text-sm opacity-90 leading-relaxed mb-6 font-medium">
                            {data.tier === "STABLE"
                                ? "You've reached the highest credit readiness tier. Maintain your current income regularity to preserve this status."
                                : `Increase your savings rate by 12% to reach the STABLE tier in your next analysis.`
                            }
                        </p>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className={`h-full bg-secondary ${data.tier === "STABLE" ? "w-full" : "w-[65%]"}`} />
                        </div>
                    </div>

                    <div className="p-6 banking-card">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Snapshot Metadata</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-muted-foreground">Processed At</span>
                                <span className="text-foreground">{new Date(data.created_at?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-muted-foreground">Source Identity</span>
                                <span className="text-foreground">{data.filename || "System Sample"}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-border flex items-center justify-center gap-1 text-[9px] uppercase font-bold text-muted-foreground">
                                <Shield size={10} />
                                <span>Bank-Grade Encryption</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
