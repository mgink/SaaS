'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.QR_CODE
                ]
            },
      /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Okuma hatalarını görmezden gel (kamera hareket ederken sürekli hata fırlatır)
                // console.warn(errorMessage); 
            }
        );

        // Temizlik
        return () => {
            try {
                scanner.clear();
            } catch (e) {
                console.error("Scanner temizleme hatası", e);
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
            <div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-20 bg-white/50 hover:bg-white text-black"
                    onClick={onClose}
                >
                    <X size={24} />
                </Button>

                <div className="p-4 text-center font-bold text-lg border-b bg-slate-50">
                    Barkodu Taratın
                </div>

                {/* Kamera Alanı */}
                <div id="reader" className="w-full bg-black min-h-[300px]"></div>

                <div className="p-4 bg-slate-50 text-center text-xs text-slate-500 flex flex-col gap-2">
                    <p>Kamerayı barkoda yaklaştırın ve sabit tutun.</p>
                    {error && <div className="text-red-500 flex items-center justify-center gap-1"><AlertCircle size={12} /> {error}</div>}
                    <p className="text-[10px] text-slate-400">Not: Telefondan test ediyorsanız HTTPS bağlantısı veya localhost gereklidir.</p>
                </div>
            </div>
        </div>
    );
}