'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PackageX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-center p-4">
            <div className="bg-white p-8 rounded-full shadow-xl mb-8 animate-bounce">
                <PackageX size={80} className="text-indigo-600" />
            </div>
            <h1 className="text-8xl font-extrabold text-slate-900 mb-2">404</h1>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Aradığınız Raf Boş!</h2>
            <p className="text-slate-500 max-w-md mb-8 text-lg">
                Bu sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
                Sistemin ana deposuna dönmek en iyisi.
            </p>
            <Link href="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 text-lg shadow-lg shadow-indigo-200">
                    <ArrowLeft className="mr-2 h-5 w-5" /> Ana Sayfaya Dön
                </Button>
            </Link>
        </div>
    );
}