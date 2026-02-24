"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-20 py-20 px-4 animate-in fade-in duration-1000">
      {/* Hero Section */}
      <section className="text-center space-y-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Bank-Grade Credit Assessment</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight text-primary">
            Institutional Credibility. <br />
            <span className="text-secondary font-black">Democratized.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            Transforming complex financial behavior into stable, institutional-grade credit signals.
            Empowering the next generation of financial stability through behavioral intelligence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="group flex items-center space-x-2 banking-button-primary px-10 py-4 rounded-xl font-bold transition-all hover:scale-[1.02]"
          >
            <span>Access Platform</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-10 py-4 rounded-xl font-bold border-2 border-border text-primary hover:bg-muted transition-colors">
            Our Methodology
          </button>
        </motion.div>

        <div className="flex items-center justify-center gap-6 pt-4 text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">256-Bit Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Real-time Analysis</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <FeatureCard
          icon={<BarChart3 className="w-6 h-6 text-primary" />}
          title="Behavioral Scoring"
          description="We analyze institutional-grade financial signals from your transactions to build a holistic credit profile."
        />
        <FeatureCard
          icon={<ShieldCheck className="w-6 h-6 text-primary" />}
          title="Explainable Intelligence"
          description="Absolute transparency in credit assessment. Our engine provides clear rationale for every rating."
        />
        <FeatureCard
          icon={<Zap className="w-6 h-6 text-primary" />}
          title="Instant Verification"
          description="Receive your Credit Readiness Certificate instantly with bank-grade security protocols."
        />
      </section>

      <div className="pb-20 text-center">
        <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">Trusted by Forward-Thinking Financial Institutions</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-10 banking-card transition-all space-y-6 group hover:border-primary/20">
      <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-primary tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
