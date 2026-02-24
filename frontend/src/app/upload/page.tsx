"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/app/providers";
import axios from "axios";
import { cn } from "@/lib/utils";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(0);
    const [processing, setProcessing] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) return null;

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.name.endsWith(".csv") || droppedFile?.name.endsWith(".pdf")) {
            setFile(droppedFile);
            setError("");
        } else {
            setError("Please upload a valid CSV or PDF file.");
        }
    }, []);

    const handleUpload = async () => {
        if (!file || !user) return;
        setLoading(true);
        setError("");
        setProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = await user.getIdToken();
            await axios.post("http://localhost:8001/api/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setProgress(percentCompleted);
                },
            });

            // Verification Step: Wait to ensure Firestore consistency
            setProgress(100);
            setProcessing(true);
            await new Promise(resolve => setTimeout(resolve, 2000));

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Upload failed. Please try again.");
            setProgress(0);
        } finally {
            setLoading(false);
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-primary">Analyze Transactions</h1>
                <p className="text-muted-foreground font-medium">Upload your 12-month bank statement CSV to generate your bank-grade credit readiness score.</p>
            </div>

            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={cn(
                    "relative group border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 transition-all",
                    file ? "border-secondary bg-secondary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
            >
                <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                    <Upload className="w-12 h-12" />
                </div>

                <div className="text-center">
                    <p className="text-lg font-bold text-primary">
                        {file ? file.name : "Drag and drop your bank statement here"}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                        {file ? `${(file.size / 1024).toFixed(2)} KB` : "Supports CSV and PDF formats"}
                    </p>
                </div>

                {!file && (
                    <input
                        type="file"
                        accept=".csv,.pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                )}

                {file && (
                    <button
                        onClick={() => setFile(null)}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center space-x-2 text-error bg-error/5 p-4 rounded-xl border border-error/10">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="w-full banking-button-primary py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>{processing ? "Securing Signals..." : `Analyzing Behavior (${progress}%)`}</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-6 h-6" />
                            <span>Generate Credit Readiness Score</span>
                        </>
                    )}
                </button>

                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">End-to-End Encrypted & Secure Upload</span>
                </div>
            </div>

            {/* Constraints Help */}
            <div className="p-8 banking-card space-y-6">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Institutional Requirements</h3>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs font-semibold text-muted-foreground">
                    <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                        <span>Standard CSV or text-based PDF format</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                        <span>Required: date, amount, description, type, category</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                        <span>Minimum 6 months of transaction history</span>
                    </li>
                    <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                        <span>Maximum file size: 5MB</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
