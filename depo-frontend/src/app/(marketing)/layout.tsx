import React from 'react';
import Link from 'next/link';
import { Package2, ArrowLeft } from 'lucide-react';

// Sadece statik sayfalar için basit bir layout
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">

            {/* BASİT HEADER */}
            <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b">
                <div className="container flex h-16 items-center justify-between px-6 mx-auto max-w-4xl">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-800">
                        <Package2 size={20} className="text-indigo-600" /> SaaS Depo
                    </Link>
                    <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">
                        <ArrowLeft size={16} /> Ana Sayfaya Dön
                    </Link>
                </div>
            </header>

            {/* İÇERİK */}
            <main className="container mx-auto py-16 px-6 max-w-4xl">
                {children}
            </main>

            {/* STATİK FOOTER (Daha sade) */}
            <footer className="bg-white border-t py-8 mt-12">
                <div className="container mx-auto text-center text-sm text-slate-500">
                    © 2025 SaaS Depo A.Ş. Tüm hakları saklıdır.
                </div>
            </footer>
        </div>
    );
}