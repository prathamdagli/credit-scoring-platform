'use client';

import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Shield, Calendar, Mail, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) return null;

    const profileStats = [
        { label: 'Account Status', value: 'Verified', icon: Shield, color: 'text-secondary' },
        { label: 'Member Since', value: new Date(user.metadata.creationTime || 0).toLocaleDateString(), icon: Calendar, color: 'text-primary' },
        { label: 'Reports Generated', value: '3', icon: FileText, color: 'text-accent' },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="banking-card p-8 md:p-12 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 blur-3xl -z-10" />

                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-border pb-12">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-primary flex items-center justify-center p-1 overflow-hidden shadow-lg shadow-primary/20 transition-all duration-500">
                            <div className="w-full h-full rounded-[1.3rem] bg-white flex items-center justify-center">
                                <User size={64} className="text-primary/80" />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-secondary w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                            <Shield size={16} className="text-white" />
                        </div>
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold tracking-tight mb-2 text-primary">
                            User <span className="text-secondary">Profile</span>
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm">
                            <Mail size={14} />
                            {user.email}
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-muted border border-border rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                            Institutional ID: {user.uid.slice(0, 8)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {profileStats.map((stat, idx) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 + 0.3 }}
                            className="bg-muted/50 border border-border/50 p-6 rounded-2xl hover:bg-muted transition-colors shadow-sm"
                        >
                            <div className={`mb-4 ${stat.color}`}>
                                <stat.icon size={24} strokeWidth={2.5} />
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">{stat.label}</div>
                            <div className="text-lg font-bold text-primary">{stat.value}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={18} className="text-primary" />
                        <h3 className="text-lg font-bold text-primary tracking-tight">
                            Security & Privacy Preferences
                        </h3>
                    </div>
                    <div className="p-6 banking-card flex items-center justify-between group cursor-not-allowed">
                        <div>
                            <div className="font-bold text-primary">Biometric Authentication</div>
                            <p className="text-xs text-muted-foreground font-medium">Secure your financial data with FaceID/TouchID</p>
                        </div>
                        <div className="w-12 h-6 bg-muted rounded-full relative">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-muted-foreground/30 rounded-full" />
                        </div>
                    </div>
                    <div className="p-6 banking-card flex items-center justify-between group cursor-not-allowed">
                        <div>
                            <div className="font-bold text-primary">Privacy Mode</div>
                            <p className="text-xs text-muted-foreground font-medium">Hide sensitive numbers on the dashboard</p>
                        </div>
                        <div className="w-12 h-6 bg-muted rounded-full relative">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-muted-foreground/30 rounded-full" />
                        </div>
                    </div>

                    <div className="pt-8 flex items-center justify-center gap-2 text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Bank-grade Security Protocols Active</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
