'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PieChart, User, LogOut, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', path: '/analytics', icon: PieChart },
        { name: 'Update Data', path: '/upload', icon: Upload },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white">
                            C
                        </div>
                        <span className="font-bold text-xl tracking-tight text-primary">
                            CREDISCOUT
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                        {item.name}
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active"
                                            className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-error transition-colors"
                >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </nav>
    );
}
