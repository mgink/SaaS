'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
// YENİ LOADER IMPORT
import { CustomLoader } from '@/components/ui/custom-loader';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            const user = response.data.user;

            if (user.isPasswordChanged === false) {
                toast.warning("Güvenliğiniz için lütfen yeni şifrenizi belirleyin.");
                router.push('/change-password');
                return;
            }

            toast.success(`Hoşgeldin, ${user.fullName}!`);
            router.push('/dashboard');

        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Giriş başarısız. Bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 relative">
            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                <ArrowLeft size={20} /> Ana Sayfaya Dön
            </Link>

            <Card className="w-[400px] shadow-xl border-slate-200">
                <CardHeader className="text-center space-y-1">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-slate-900 rounded-full">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">SaaS Depo</CardTitle>
                    <CardDescription>Hesabınıza giriş yapın</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta Adresi</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                            {loading ? <CustomLoader size="sm" className="mr-2" /> : 'Giriş Yap'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center text-xs text-slate-400 flex-col gap-2">
                    <div>Hesabınız yok mu? <Link href="/register" className="text-blue-600 hover:underline">Kayıt Olun</Link></div>
                </CardFooter>
            </Card>
        </div>
    );
}