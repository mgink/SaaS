'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error("Şifreler eşleşmiyor.");
            return;
        }
        if (passwords.new.length < 6) {
            toast.error("Şifre en az 6 karakter olmalı.");
            return;
        }

        setLoading(true);
        try {
            await api.patch('/auth/change-password', { password: passwords.new });
            toast.success("Şifreniz başarıyla oluşturuldu!");

            // User verisini güncelle (isPasswordChanged: true yapmak için)
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.isPasswordChanged = true;
            localStorage.setItem('user', JSON.stringify(user));

            router.push('/dashboard');
        } catch (e) {
            /* Global error handler */
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-[400px] shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2"><Lock className="text-blue-600" size={24} /></div>
                    <CardTitle>Şifre Belirleyin</CardTitle>
                    <CardDescription>Güvenliğiniz için lütfen yeni şifrenizi belirleyiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Yeni Şifre</Label>
                            <Input type="password" required value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Şifre Tekrar</Label>
                            <Input type="password" required value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                        </div>
                        <Button type="submit" className="w-full bg-slate-900" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Şifreyi Kaydet ve Giriş Yap'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}