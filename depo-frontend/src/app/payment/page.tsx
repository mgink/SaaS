'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { toast } from "sonner"; // <--- Import

export default function PaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [planCode, setPlanCode] = useState('');
    const [registerData, setRegisterData] = useState<any>(null);

    useEffect(() => {
        const plan = searchParams.get('plan');
        if (plan) setPlanCode(plan);

        const data = localStorage.getItem('temp_register_data');
        if (data) {
            setRegisterData(JSON.parse(data));
        } else {
            router.push('/register');
        }
    }, [searchParams, router]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const finalData = { ...registerData, planCode: planCode };
            await api.post('/auth/register', finalData);
            localStorage.removeItem('temp_register_data');

            toast.success('Ödeme başarıyla alındı ve hesabınız oluşturuldu! Giriş yapabilirsiniz.'); // <--- Toast
            router.push('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ödeme veya Kayıt işlemi başarısız.'); // <--- Toast
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (confirm("İşlemi iptal etmek istediğinize emin misiniz?")) {
            localStorage.removeItem('temp_register_data');
            toast.info("İşlem iptal edildi."); // <--- Toast
            router.push('/');
        }
    };

    if (!registerData) return null;

    // ... (Render kısmı aynı, sadece handlePayment içindeki toast değişti) ...
    // Kodu kısa tutmak için render kısmını kopyalamadım, önceki cevaptakiyle aynı.
    // ... (Buraya önceki cevabın return bloğunu yapıştır) ...
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-[450px] shadow-2xl border-t-4 border-t-purple-600">

                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <CreditCard className="text-purple-600 h-6 w-6" /> Güvenli Ödeme
                    </CardTitle>
                    <CardDescription>
                        Seçilen Paket: <span className="font-bold text-slate-900 bg-purple-100 px-2 py-0.5 rounded text-xs">{planCode}</span>
                        <br />
                        <span className="text-xs text-slate-500 mt-1 block">Lütfen kart bilgilerinizi giriniz.</span>
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handlePayment} className="space-y-5">

                        <div className="space-y-2">
                            <Label>Kart Üzerindeki İsim</Label>
                            <Input
                                placeholder="Ad Soyad"
                                required
                                defaultValue={registerData.fullName} // Kayıt formundan gelen ismi öner
                                className="focus-visible:ring-purple-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Kart Numarası</Label>
                            <div className="relative">
                                <Input
                                    placeholder="0000 0000 0000 0000"
                                    required
                                    maxLength={19}
                                    className="pl-10 focus-visible:ring-purple-500 font-mono"
                                />
                                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Son Kul. Tarihi</Label>
                                <Input
                                    placeholder="AA/YY"
                                    required
                                    maxLength={5}
                                    className="focus-visible:ring-purple-500 font-mono text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CVC / CVV</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="123"
                                        required
                                        maxLength={3}
                                        type="password"
                                        className="focus-visible:ring-purple-500 font-mono text-center pr-8"
                                    />
                                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            {/* İPTAL BUTONU */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-1/3 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                onClick={handleCancel}
                            >
                                İptal Et
                            </Button>

                            {/* ÖDEME BUTONU */}
                            <Button
                                type="submit"
                                className="w-2/3 bg-purple-600 hover:bg-purple-700 h-10 transition-all shadow-md shadow-purple-200"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" /> İşleniyor...
                                    </>
                                ) : (
                                    'Ödemeyi Tamamla'
                                )}
                            </Button>
                        </div>

                    </form>
                </CardContent>

                <CardFooter className="justify-center text-[10px] text-slate-400 bg-slate-50/80 py-3 border-t">
                    <div className="flex items-center gap-1">
                        <Lock size={10} className="text-green-600" />
                        <span>256-bit SSL şifreleme ile korunmaktadır.</span>
                    </div>
                </CardFooter>

            </Card>
        </div>
    );
}