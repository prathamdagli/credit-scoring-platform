"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Brain, BarChart, Zap, Database, Search, CheckCircle, Scale } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-secondary/20"
          >
            <Shield className="w-3 h-3" />
            <span>Technical Whitepaper</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
            Our <span className="text-secondary tracking-tighter">Methodology</span>
          </h1>
          <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">
            A deep dive into the Crediscout Financial Intelligence Engine—combining behavioral heuristics with institutional-grade risk modeling.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <MethodologyCard
            icon={<Database className="w-6 h-6 text-indigo-400" />}
            title="Intelligent Data Ingestion"
            description="Our parser handles multi-format bank statements (PDF, CSV, XLSX) using fuzzy logic to normalize varying column headers into a standardized institutional transaction schema."
          />
          <MethodologyCard
            icon={<Search className="w-6 h-6 text-emerald-400" />}
            title="NLP Categorization"
            description="We utilize keyword-based NLP and semantic heuristics to categorize raw transaction descriptions into risk-relevant buckets (EMI, Rent, Savings, Discretionary) without manual tagging."
          />
          <MethodologyCard
            icon={<Brain className="w-6 h-6 text-amber-400" />}
            title="Behavioral Heuristics"
            description="Unlike traditional credit Bureaus, we look at the 'Why' behind the numbers—measuring income consistency, savings velocity, and commitment discipline in real-time."
          />
          <MethodologyCard
            icon={<Scale className="w-6 h-6 text-rose-400" />}
            title="Realistic Scoring Model"
            description="Our model mimics institutional credit logic: starting from a baseline and applying weighted adjustments based on extracted behavioral features with temporal smoothing."
          />
        </div>

        {/* Deep Dive Section */}
        <div className="space-y-12 pt-10">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
              <BarChart className="w-6 h-6 text-secondary" />
              Scoring Components
            </h2>
            <div className="prose prose-indigo max-w-none text-muted-foreground font-medium">
              <p>
                The Crediscout score is composed of several critical behavioral domains, each weighted to reflect its impact on long-term financial stability:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
                <li className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-3">
                  <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                  <span><strong>Income Stability (25%)</strong>: Predictability and frequency of core inflows.</span>
                </li>
                <li className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-3">
                  <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                  <span><strong>Savings Velocity (30%)</strong>: The net retention rate post-discretionary spend.</span>
                </li>
                <li className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-3">
                  <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                  <span><strong>Debt Management (20%)</strong>: Impact of recurring EMI burdens and fixed commits.</span>
                </li>
                <li className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-3">
                  <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                  <span><span><strong>Wealth Discipline (25%)</strong>: Presence of insurance and investment transactions.</span></span>
                </li>
              </ul>
            </div>
          </section>

          {/* Call to Action */}
          <div className="bg-primary p-12 rounded-[2.5rem] text-center space-y-6 shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-bold text-white">Ready to see your institutional rating?</h3>
              <p className="text-white/60 max-w-md mx-auto font-medium">
                Upload your latest statement and get your Grade-A Credit Readiness Certificate in seconds.
              </p>
              <Zap className="w-12 h-12 text-secondary mx-auto mb-4 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodologyCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 bg-white border border-border rounded-3xl space-y-4 hover:shadow-xl hover:shadow-primary/5 transition-all hover:-translate-y-1 duration-300">
      <div className="p-3 bg-muted/50 rounded-2xl w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-primary tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
