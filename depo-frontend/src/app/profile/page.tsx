'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Lock, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [form, setForm] = useState({ fullName: '', email: '', phone: '', currentPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const localUser = localStorage.getItem('user');
        if (localUser) {
            const u = JSON.parse(localUser);
            setUser(u);
            setForm(prev => ({ ...prev, fullName: u.fullName, email: u.email, phone: u.phone || '' }));
        }
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = { fullName: form.fullName, phone: form.phone };
            if (form.newPassword) {
                if (!form.currentPassword) { toast.error("Şifre değiştirmek için mevcut şifrenizi girmelisiniz."); setLoading(false); return; }
                payload.password = form.newPassword;
                payload.currentPassword = form.currentPassword;
            }

            const res = await api.patch(`/users/${user.id}`, payload); // Backend'de user update endpointine currentPassword kontrolü eklenebilir

            // LocalStorage güncelle
            const updatedUser = { ...user, fullName: form.fullName, phone: form.phone };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success("Profil güncellendi.");
            setForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        } catch (e) { /* Global error handler */ } finally { setLoading(false); }
    }

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Profil Ayarları</h1>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><User /> Kişisel Bilgiler</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Ad Soyad</Label><Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
                                <div className="space-y-2"><Label>E-posta (Değiştirilemez)</Label><Input disabled value={form.email} className="bg-slate-100" /></div>
                                <div className="space-y-2"><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Lock size={16} /> Şifre Değiştir</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Mevcut Şifre</Label><Input type="password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Yeni Şifre</Label><Input type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} /></div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 size={16}" />} Kaydet
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}