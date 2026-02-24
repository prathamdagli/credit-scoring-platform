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
    insights: Insight[];
}

const AIInsights = ({ insights }: AIInsightsProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 text-primary">
                <Info className="w-5 h-5" />
                <h3 className="text-lg font-bold tracking-tight">AI Behavioral Analysis</h3>
            </div>

            <div className="space-y-4">
                {insights.map((insight, index) => (
                    <motion.div
                        key={insight.feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-4 banking-card group hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={cn(
                                "p-2 rounded-xl",
                                insight.positive ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
                            )}>
                                {insight.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{insight.feature}</p>
                                <p className="text-xs text-muted-foreground">
                                    {insight.positive ? "Positively" : "Negatively"} impacting your readiness.
                                </p>
                            </div>
                        </div>
                        <div className={cn(
                            "text-xs font-mono font-bold px-2 py-1 rounded-md",
                            insight.positive ? "bg-secondary/20 text-secondary" : "bg-error/20 text-error"
                        )}>
                            {insight.impact > 0 ? "+" : ""}{insight.impact.toFixed(3)}
                        </div>
                    </motion.div>
                ))}
            </div>

            <p className="text-[10px] text-muted-foreground italic text-center">
                Powered by SHAP (SHapley Additive exPlanations) for model transparency.
            </p>
        </div>
    );
};

export default AIInsights;
