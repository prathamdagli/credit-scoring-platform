'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PieChart, User, LogOut, Upload, BookOpen, Shield } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (loading) return null;

    const authenticatedItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', path: '/analytics', icon: PieChart },
        { name: 'Upload', path: '/upload', icon: Upload },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-indigo-100/50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-indigo-950">CREDISCOUT</span>
                    </Link>

                    {user && (
                        <div className="hidden md:flex items-center gap-1">
                            {authenticatedItems.map((item) => {
                                const isActive = pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <item.icon size={16} strokeWidth={2.5} />
                                            {item.name}
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-active"
                                                className="absolute bottom-1 left-4 right-4 h-0.5 bg-indigo-600 rounded-full"
                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Link 
                        href="/methodology" 
                        className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${pathname === '/methodology' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}
                    >
                        <BookOpen size={16} strokeWidth={2.5} />
                        <span>Methodology</span>
                    </Link>

                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                        >
                            <LogOut size={16} strokeWidth={2.5} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95"
                        >
                            Log In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
