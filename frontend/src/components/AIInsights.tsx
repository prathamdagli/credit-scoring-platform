"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
    feature: string;
    impact: number;
    positive: boolean;
}

interface AIInsightsProps {
    insights: string[];
}

const AIInsights = ({ insights }: AIInsightsProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 text-indigo-400 mb-4">
                <Info className="w-5 h-5" />
                <h3 className="text-lg font-bold tracking-tight text-white">AI Behavioral Analysis</h3>
            </div>

            <div className="space-y-4">
                {insights && insights.length > 0 ? insights.map((insight, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start p-4 bg-indigo-900/40 rounded-xl border border-indigo-500/20 shadow-sm"
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-indigo-100 leading-relaxed">{insight}</p>
                        </div>
                    </motion.div>
                )) : (
                    <p className="text-indigo-300/60 text-sm italic">Generate a scenario to view dynamic insights.</p>
                )}
            </div>
            
            <p className="text-[10px] text-indigo-300/40 italic text-center mt-6">
                Powered by SHAP (SHapley Additive exPlanations) for model transparency.
            </p>
        </div>
    );
};

export default AIInsights;
