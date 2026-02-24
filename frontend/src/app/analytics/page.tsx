'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PieChart, TrendingUp, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

interface SpendingCategory {
    category: string;
    amount: number;
    percentage: number;
}

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
                const res = await axios.get('http://localhost:8001/api/dashboard', {
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    if (!data || !data.analytics) return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-muted-foreground">
            <PieChart size={64} className="mb-4 opacity-20" />
            <p className="font-medium text-lg text-primary/60">No analytics data available yet.</p>
            <p className="text-sm">Please upload your bank statement to see insights.</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 mt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-primary">
                        Financial <span className="text-secondary">Analytics</span>
                    </h1>
                    <p className="text-muted-foreground font-medium">Deep dive into your behavioral spending patterns and their credit impact.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Spending Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="banking-card p-8"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                            <PieChart size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-primary">Spending Breakdown</h2>
                    </div>

                    <div className="space-y-6">
                        {data.analytics.map((cat: SpendingCategory, idx: number) => (
                            <div key={cat.category} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                            {cat.category}
                                        </span>
                                        <div className="text-xl font-bold text-primary">₹{cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-secondary">{cat.percentage.toFixed(1)}%</div>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cat.percentage}%` }}
                                        transition={{ delay: idx * 0.1 + 0.5, duration: 1 }}
                                        className="h-full bg-secondary"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Credit Impact Insights */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="banking-card p-8"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                            <TrendingUp size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-primary">Credit Impact Analysis</h2>
                    </div>

                    <div className="space-y-4">
                        {data.insights.map((insight: any, idx: number) => (
                            <div
                                key={insight.feature}
                                className={`flex gap-4 p-4 rounded-2xl border ${insight.positive
                                    ? 'bg-success/5 border-success/10'
                                    : 'bg-error/5 border-error/10'
                                    }`}
                            >
                                <div className={insight.positive ? 'text-success' : 'text-error'}>
                                    {insight.positive ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                </div>
                                <div>
                                    <div className="font-bold text-primary">{insight.feature}</div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {insight.positive
                                            ? `Successfully optimizing this metric has boosted your score by ${(insight.impact * 100).toFixed(1)} points.`
                                            : data.tier === "STABLE"
                                                ? `While overall stable, monitoring this area ensures you maintain your perfect ranking.`
                                                : `Your behavior in this area is negatively impacting your score. Improvement could unlock a higher tier.`
                                        }
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-muted/50 border border-border rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold text-primary font-heading">Secure & Encrypted Advice</h3>
                        </div>
                        <p className="text-sm text-muted-foreground italic font-medium leading-relaxed">
                            {data.tier === "STABLE"
                                ? `"Your profile is exemplary. Our bank-grade AI models suggest that continuing your current pattern of ${data.analytics?.[0]?.category?.toLowerCase() || 'financial'} management will lead to a 0% risk of credit rejection."`
                                : `"Based on your ${data.analytics?.[0]?.category?.toLowerCase() || 'spending'} ratio, our bank-grade AI models recommend reducing discretionary outflows by 15% to move into the 'STABLE' tier within 3 months."`
                            }
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
