'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GitBranch, Plus, MapPin, Phone, Trash2, Store, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function BranchesPage() {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        name: '', location: '', phone: '',
        // Yönetici Bilgileri (Opsiyonel)
        addManager: false,
        managerName: '', managerEmail: '', managerPhone: '', managerPassword: ''
    });

    const fetchBranches = async () => {
        try {
            const res = await api.get('/branches');
            setBranches(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchBranches(); }, []);

    const handleCreate = async () => {
        if (!formData.name) return;
        try {
            // Eğer yönetici ekleme kapalıysa o alanları gönderme
            const payload = { ...formData };
            if (!formData.addManager) {
                delete (payload as any).managerName;
                delete (payload as any).managerEmail;
                delete (payload as any).managerPassword;
            }

            await api.post('/branches', payload);
            setFormData({ name: '', location: '', phone: '', addManager: false, managerName: '', managerEmail: '', managerPhone: '', managerPassword: '' });
            setIsCreateOpen(false);
            fetchBranches();
            toast.success(formData.addManager ? "Şube ve Yönetici oluşturuldu." : "Şube oluşturuldu.");
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Hata oluştu.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Şubeyi silmek istediğinize emin misiniz?')) return;
        try { await api.delete(`/branches/${id}`); fetchBranches(); toast.success("Silindi."); }
        catch (e) { toast.error("Silinemedi."); }
    }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-slate-900">Şube Yönetimi</h1><p className="text-sm text-slate-500">Farklı lokasyonlardaki şubelerinizi ve yöneticilerini yönetin.</p></div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Yeni Şube</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Yeni Şube Ekle</DialogTitle></DialogHeader>
                        <div className="space-y-4 mt-4">
                            {/* ŞUBE BİLGİLERİ */}
                            <div className="space-y-2"><Label>Şube Adı *</Label><Input placeholder="Örn: Kadıköy Şubesi" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Konum</Label><Input placeholder="Adres..." value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Telefon</Label><Input placeholder="0212..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                            </div>

                            {/* YÖNETİCİ EKLEME ALANI */}
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="addManager" className="w-4 h-4" checked={formData.addManager} onChange={e => setFormData({ ...formData, addManager: e.target.checked })} />
                                    <Label htmlFor="addManager" className="cursor-pointer font-bold text-slate-700">Şube Yöneticisi Ata</Label>
                                </div>

                                {formData.addManager && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 pt-2 border-t border-slate-200">
                                        <div className="space-y-2"><Label>Yönetici Ad Soyad</Label><Input value={formData.managerName} onChange={e => setFormData({ ...formData, managerName: e.target.value })} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label>E-posta</Label><Input type="email" value={formData.managerEmail} onChange={e => setFormData({ ...formData, managerEmail: e.target.value })} /></div>
                                            <div className="space-y-2"><Label>Cep Tel</Label><Input value={formData.managerPhone} onChange={e => setFormData({ ...formData, managerPhone: e.target.value })} /></div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Geçici Şifre</Label>
                                            <Input type="password" placeholder="******" value={formData.managerPassword} onChange={e => setFormData({ ...formData, managerPassword: e.target.value })} />
                                            <p className="text-[10px] text-slate-500">Yönetici ilk girişinde şifresini değiştirmek zorunda kalacaktır.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button onClick={handleCreate} className="w-full bg-slate-900">Oluştur</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {branches.map((b) => (
                    <Card key={b.id} className="hover:shadow-md transition-shadow border-t-4 border-t-indigo-500 group relative bg-white/70 backdrop-blur">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(b.id)}><Trash2 size={16} /></Button>
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2"><Store className="text-indigo-500" size={20} /> {b.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-sm text-slate-600 flex items-center gap-2"><MapPin size={14} /> {b.location || 'Konum Yok'}</div>

                            {/* YÖNETİCİ BİLGİSİ */}
                            {b.users && b.users.length > 0 ? (
                                <div className="bg-indigo-50 p-2 rounded flex items-center gap-2 text-sm text-indigo-700">
                                    <ShieldCheck size={14} />
                                    <span className="font-medium">{b.users[0].fullName}</span>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 italic flex items-center gap-1"><User size={12} /> Yönetici atanmamış</div>
                            )}

                            <div className="pt-4 border-t flex gap-4 text-xs font-medium text-slate-500">
                                <span>{b._count.warehouses} Depo</span>
                                <span>{b._count.users} Personel</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}