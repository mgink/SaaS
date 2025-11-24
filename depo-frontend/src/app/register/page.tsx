'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Loader2, Check, Crown, CheckCircle2, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [isPlanOpen, setIsPlanOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    // Normal Kayıt Formu
    const [formData, setFormData] = useState({ companyName: '', subdomain: '', email: '', password: '', planCode: '' });

    // Teklif Formu (Yeni)
    const [contactForm, setContactForm] = useState({ companyName: '', fullName: '', email: '', phone: '', message: '' });

    useEffect(() => {
        api.get('/auth/plans').then(res => {
            setPlans(res.data);
            const free = res.data.find((p: any) => p.price === 0 && p.code !== 'ENTERPRISE');
            if (free) { setSelectedPlan(free); setFormData(prev => ({ ...prev, planCode: free.code })); }
        }).catch(err => toast.error("Planlar yüklenirken hata oluştu."));
    }, []);

    const handleSelectPlan = (plan: any) => {
        setSelectedPlan(plan);
        setFormData({ ...formData, planCode: plan.code });
        setIsPlanOpen(false);
    };

    // NORMAL KAYIT
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlan) { toast.warning("Lütfen bir paket seçiniz."); setIsPlanOpen(true); return; }
        if (selectedPlan.code === 'ENTERPRISE') return; // Enterprise için bu form kullanılmaz

        if (selectedPlan.price > 0) {
            localStorage.setItem('temp_register_data', JSON.stringify(formData));
            router.push(`/payment?plan=${selectedPlan.code}`);
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/register', formData);
            toast.success("Kayıt başarılı! Giriş ekranına yönlendiriliyorsunuz.");
            setTimeout(() => router.push('/login'), 2000);
        } catch (error: any) { toast.error(error.response?.data?.message || 'Kayıt başarısız.'); } finally { setLoading(false); }
    };

    // TEKLİF GÖNDER
    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/enterprise-request', contactForm);
            toast.success("Talebiniz alındı! Satış ekibimiz sizinle iletişime geçecektir.");
            setTimeout(() => router.push('/'), 3000);
        } catch (e) { toast.error("Talep gönderilemedi."); } finally { setLoading(false); }
    }

    // Seçilen paket Enterprise ise bambaşka bir form göster
    const isEnterprise = selectedPlan?.code === 'ENTERPRISE';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-[500px] shadow-xl border-t-4 border-t-blue-600">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4"><div className="p-3 bg-blue-100 rounded-full"><Building2 className="w-8 h-8 text-blue-600" /></div></div>
                    <CardTitle className="text-2xl font-bold">{isEnterprise ? 'Kurumsal Teklif Alın' : 'Hesap Oluştur'}</CardTitle>
                    <CardDescription>{isEnterprise ? 'İhtiyaçlarınıza özel çözüm için formu doldurun.' : 'SaaS Depo dünyasına adım atın'}</CardDescription>
                </CardHeader>

                <CardContent>
                    {/* PAKET SEÇİM BUTONU */}
                    <div className="mb-6">
                        <Label className="mb-2 block">Seçilen Paket</Label>
                        <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                            <DialogTrigger asChild>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all flex items-center justify-between group">
                                    {selectedPlan ? (
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${selectedPlan.code === 'ENTERPRISE' ? 'bg-yellow-100 text-yellow-600' : (selectedPlan.price > 0 ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600')}`}>
                                                {selectedPlan.code === 'ENTERPRISE' ? <Building2 size={20} /> : (selectedPlan.price > 0 ? <Crown size={20} /> : <CheckCircle2 size={20} />)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{selectedPlan.name}</div>
                                                <div className="text-xs text-slate-500">{selectedPlan.price === 0 ? (selectedPlan.code === 'ENTERPRISE' ? 'Teklif Alın' : 'Ücretsiz') : `${selectedPlan.price} ₺ / ay`}</div>
                                            </div>
                                        </div>
                                    ) : <span className="text-slate-400 font-medium">Bir paket seçmek için tıklayın</span>}
                                    <Button type="button" variant="secondary" size="sm">Değiştir</Button>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50">
                                <DialogHeader><DialogTitle className="text-2xl text-center font-bold mb-4">Paket Seçimi</DialogTitle></DialogHeader>
                                <div className="grid md:grid-cols-3 gap-4 p-2">
                                    {plans.map((plan) => (
                                        <div key={plan.id} onClick={() => handleSelectPlan(plan)} className={`relative bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl flex flex-col justify-between ${selectedPlan?.code === plan.code ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-100'}`}>
                                            <div className="text-center mb-4"><h3 className="font-bold text-lg text-slate-800">{plan.name}</h3><div className="mt-2"><span className="text-3xl font-extrabold text-slate-900">{plan.price === 0 ? (plan.code === 'ENTERPRISE' ? 'Teklif' : 'Ücretsiz') : `${plan.price}₺`}</span></div></div>
                                            <ul className="space-y-3 text-sm text-slate-600 mb-6 flex-1">
                                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> <strong>{plan.maxUsers === 0 ? 'Sınırsız' : plan.maxUsers}</strong> Kullanıcı</li>
                                                {plan.features.map((feat: string, i: number) => (<li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-500" /> {feat}</li>))}
                                            </ul>
                                            <Button className={`w-full ${selectedPlan?.code === plan.code ? 'bg-blue-600' : 'bg-slate-900'}`}>{selectedPlan?.code === plan.code ? 'Seçildi' : 'Seç'}</Button>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {isEnterprise ? (
                        // ENTERPRISE FORMU (TEKLİF)
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div className="space-y-2"><Label>Şirket Adı</Label><Input required placeholder="Holding A.Ş." value={contactForm.companyName} onChange={(e) => setContactForm({ ...contactForm, companyName: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Yetkili Ad Soyad</Label><Input required value={contactForm.fullName} onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>E-posta</Label><Input type="email" required value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Telefon</Label><Input type="tel" required placeholder="05XX..." value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2"><Label>Mesaj / İhtiyaçlar</Label><Textarea placeholder="Kaç kullanıcınız var? Özel istekleriniz neler?" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} /></div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-11" disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2" /> : 'Teklif İste'}</Button>
                        </form>
                    ) : (
                        // NORMAL KAYIT FORMU
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2"><Label>Şirket Adı</Label><Input required placeholder="Örn: Teknoloji A.Ş." value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Firma Kodu</Label><Input required placeholder="teknoloji" value={formData.subdomain} onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })} /></div>
                            <div className="space-y-2"><Label>E-posta</Label><Input type="email" required placeholder="admin@sirket.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Şifre</Label><Input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
                            <div className="pt-2"><Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11 text-base" disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2" /> : (selectedPlan?.price > 0 ? 'Ödemeye Geç' : 'Hesabı Oluştur')}</Button></div>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="justify-center border-t bg-slate-50/50 py-4">
                    <p className="text-sm text-slate-500">Zaten hesabınız var mı? <Link href="/login" className="text-blue-600 hover:underline font-medium">Giriş Yap</Link></p>
                </CardFooter>
            </Card>
        </div>
    );
}