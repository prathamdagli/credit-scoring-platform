"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScoreGaugeProps {
    score: number;
    tier: string;
}

const ScoreGauge = ({ score, tier }: ScoreGaugeProps) => {
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getTierColor = (t: string) => {
        const lowerTier = t.toLowerCase();
        if (lowerTier.includes('stable') || lowerTier.includes('excellent')) return "#10B981"; // Emerald
        if (lowerTier.includes('moderate')) return "#F59E0B"; // Amber
        if (lowerTier.includes('risky')) return "#EF4444"; // Rose
        return "#4F46E5"; // Indigo default
    };

    const color = getTierColor(tier);

    return (
        <div className="relative flex items-center justify-center p-4">
            <svg className="w-56 h-56 transform -rotate-90 drop-shadow-2xl">
                {/* Background Track */}
                <circle
                    cx="112"
                    cy="112"
                    r={radius}
                    stroke="#E2E8F0"
                    strokeWidth="4"
                    fill="transparent"
                    className="opacity-30"
                />
                {/* Progress Stroke */}
                <motion.circle
                    cx="112"
                    cy="112"
                    r={radius}
                    stroke={color}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: "circOut" }}
                    strokeLinecap="round"
                />
                {/* Accent Glow */}
                <motion.circle
                    cx="112"
                    cy="112"
                    r={radius}
                    stroke={color}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference, opacity: 0 }}
                    animate={{ strokeDashoffset: offset, opacity: 0.15 }}
                    transition={{ duration: 2.5, ease: "circOut" }}
                    className="blur-md"
                />
            </svg>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">C-Score Index</p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col"
                >
                    <span className="text-6xl font-black tracking-tighter text-indigo-950">
                        {Math.round(score)}
                    </span>
                    <div className="w-12 h-1 bg-indigo-100 mx-auto rounded-full mt-1"></div>
                </motion.div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mt-2">Institutional Grade</span>
            </div>
        </div>
    );
};

export default ScoreGauge;
