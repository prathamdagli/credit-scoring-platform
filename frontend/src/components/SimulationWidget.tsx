'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/providers';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Sparkles } from 'lucide-react';

interface SimulationWidgetProps {
    scoreId: string;
    currentScore: number;
}

export default function SimulationWidget({ scoreId, currentScore }: SimulationWidgetProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [scenario, setScenario] = useState('increase_savings');
    const [magnitude, setMagnitude] = useState('0.10'); // 10%
    const [error, setError] = useState('');

    const runSimulation = async () => {
        if (!user || !scoreId) return;
        setLoading(true);
        setError('');
        try {
            const token = await user.getIdToken();
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/simulate`, {
                score_id: scoreId,
                scenario,
                magnitude: parseFloat(magnitude)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to run simulation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-8 rounded-3xl shadow-xl border border-indigo-800 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-300" />
                </div>
                <h2 className="text-xl font-bold text-white">Scenario Simulation</h2>
            </div>
            
            <p className="text-indigo-200 text-sm mb-6 relative z-10">
                See how changing your financial behavior could impact your credit score instantly safely.
            </p>

            <div className="space-y-4 mb-8 relative z-10">
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2 block">If I were to...</label>
                    <select 
                        value={scenario} 
                        onChange={(e) => setScenario(e.target.value)}
                        className="w-full bg-indigo-950/50 border border-indigo-700/50 text-white text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-400 outline-none appearance-none font-medium"
                    >
                        <option value="increase_savings">Increase Monthly Savings</option>
                        <option value="decrease_emi">Decrease Fixed EMI Burden</option>
                        <option value="increase_income">Increase Monthly Income</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2 block">By...</label>
                    <div className="flex items-center gap-4 bg-indigo-950/50 border border-indigo-700/50 rounded-xl px-4 py-2">
                        <input 
                            type="range" 
                            min="5" max="30" step="5" 
                            value={parseFloat(magnitude) * 100} 
                            onChange={(e) => setMagnitude((parseInt(e.target.value) / 100).toString())}
                            className="flex-1 accent-indigo-400"
                        />
                        <span className="font-bold text-indigo-400 min-w-[30px]">{parseFloat(magnitude) * 100}%</span>
                    </div>
                </div>

                <button 
                    onClick={runSimulation}
                    disabled={loading}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Simulate Impact
                </button>
                {error && <p className="text-rose-400 text-xs text-center font-bold mt-2">{error}</p>}
            </div>

            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-indigo-950/50 backdrop-blur border border-indigo-800/80 rounded-2xl p-5 relative z-10"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-indigo-100">Projected Impact</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-black">{result.simulated_score}</span>
                            <div className={`text-xs font-bold flex items-center gap-1 ${result.difference > 0 ? 'text-emerald-400' : result.difference < 0 ? 'text-rose-400' : 'text-indigo-300'}`}>
                                {result.difference > 0 ? <ArrowUpRight className="w-3 h-3" /> : result.difference < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                                {result.difference > 0 ? `+${result.difference}` : result.difference} pts
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-indigo-200 font-medium">
                        {result.message}
                    </p>
                </motion.div>
            )}
        </div>
    );
}
