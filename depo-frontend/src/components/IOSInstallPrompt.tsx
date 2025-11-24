'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Share, PlusSquare } from 'lucide-react';

export default function IOSInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const ua = window.navigator.userAgent;
        const ios = /iPhone|iPad|iPod/.test(ua);
        // @ts-ignore
        const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

        setIsIOS(ios);
        setIsStandalone(standalone);

        // Eğer iOS ise ve uygulama modunda değilse göster
        if (ios && !standalone) {
            // Daha önce kapatmadıysa göster (LocalStorage)
            const closed = localStorage.getItem('ios_prompt_closed');
            if (!closed) setIsVisible(true);
        }
    }, []);

    if (!isIOS || isStandalone || !isVisible) return null;

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('ios_prompt_closed', 'true');
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-slate-800 font-medium">Uygulamayı Yükle</p>
                <button onClick={handleClose}><X size={18} className="text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Daha iyi bir deneyim için SaaS Depo'yu ana ekranınıza ekleyin.</p>

            <div className="flex items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                    1. <Share size={16} className="text-blue-600" /> butonuna basın.
                </div>
                <div className="flex items-center gap-2">
                    2. <PlusSquare size={16} className="text-slate-800" /> <strong>Ana Ekrana Ekle</strong> deyin.
                </div>
            </div>
        </div>
    );
}