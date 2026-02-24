"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScoreGaugeProps {
    score: number;
    tier: string;
}

const ScoreGauge = ({ score, tier }: ScoreGaugeProps) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getTierColor = (t: string) => {
        switch (t) {
            case "STABLE": return "#2E7D6E"; // Muted Teal
            case "MODERATE": return "#1E3A5F"; // Muted Blue
            case "RISKY": return "#9B2C2C"; // Muted Red
            default: return "#1C1C1C";
        }
    };

    const color = getTierColor(tier);

    return (
        <div className="relative flex items-center justify-center p-8">
            <svg className="w-48 h-48 transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx="96"
                    cy="96"
                    r={radius}
                    stroke={color}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="butt"
                />
            </svg>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-5xl font-bold tracking-tight text-primary"
                >
                    {Math.round(score)}
                </motion.span>
                <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mt-1">Score</span>
            </div>
        </div>
    );
};

export default ScoreGauge;
