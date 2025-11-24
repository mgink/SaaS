'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { SearchCommand } from './SearchCommand';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/');
        } else {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        // Zemin rengi tekrar sabit light mode tonuna çekildi
        <div className="min-h-screen w-full bg-slate-100/80">

            <SearchCommand />

            {/* SIDEBAR (Sabit) */}
            <Sidebar userRole={user?.role} />

            {/* ANA İÇERİK ALANI */}
            <div className="flex flex-col transition-all duration-300 ease-in-out md:pl-64 lg:pl-72">

                <Header user={user} />

                <main className="flex-1 p-4 lg:p-8">
                    <div className="mx-auto w-full max-w-7xl space-y-6">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}