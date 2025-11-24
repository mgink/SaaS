'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Phone, MapPin, Edit2, Trash2, Truck, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState('');

    const initialForm = { name: '', contactName: '', phone: '', email: '', address: '', category: '' };
    const [formData, setFormData] = useState(initialForm);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // DÜZELTME: fetchWarehouses kaldırıldı, sadece fetchSuppliers çağrılıyor
    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await api.patch(`/suppliers/${selectedId}`, formData);
                toast.success("Tedarikçi güncellendi.");
            } else {
                await api.post('/suppliers', formData);
                toast.success("Tedarikçi eklendi.");
            }
            setOpen(false); setFormData(initialForm); setIsEdit(false);
            fetchSuppliers();
        } catch (e) { toast.error("İşlem başarısız."); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try { await api.delete(`/suppliers/${id}`); fetchSuppliers(); toast.success("Silindi."); }
        catch (e: any) { toast.error(e.response?.data?.message || "Hata."); }
    }

    const openEdit = (s: any) => {
        setFormData({ name: s.name, contactName: s.contactName || '', phone: s.phone || '', email: s.email || '', address: s.address || '', category: s.category || '' });
        setSelectedId(s.id); setIsEdit(true); setOpen(true);
    }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-slate-900">Tedarikçiler</h1><p className="text-sm text-slate-500">Mal alımı yaptığınız firmalar.</p></div>
                <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setIsEdit(false); setFormData(initialForm); } }}>
                    <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Yeni Tedarikçi</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader><DialogTitle>{isEdit ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <div className="space-y-2"><Label>Firma Adı *</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: Bereket Gıda" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Kategori</Label>
                                    <Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}>
                                        <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                        <SelectContent><SelectItem value="Gıda">Gıda</SelectItem><SelectItem value="İçecek">İçecek</SelectItem><SelectItem value="Temizlik">Temizlik</SelectItem><SelectItem value="Ambalaj">Ambalaj</SelectItem><SelectItem value="Diğer">Diğer</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Yetkili Kişi</Label><Input value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Telefon</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                                <div className="space-y-2"><Label>E-posta</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2"><Label>Adres</Label><Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                            <Button type="submit" className="w-full bg-slate-900">{isEdit ? 'Güncelle' : 'Kaydet'}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((s) => (
                    <Card key={s.id} className="group relative hover:shadow-md transition-shadow bg-white/70 backdrop-blur-sm border border-slate-100">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit2 size={16} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></Button>
                        </div>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2"><Truck className="text-blue-600" size={20} /> {s.name}</h3>
                                    <Badge variant="outline" className="mt-1 bg-slate-50">{s.category || 'Genel'}</Badge>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                                {s.contactName && <div className="flex items-center gap-2"><User size={14} className="text-slate-400" /> {s.contactName}</div>}
                                {s.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {s.phone}</div>}
                                {s.address && <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {s.address}</div>}
                            </div>
                            <div className="mt-4 pt-4 border-t text-xs text-slate-400 flex justify-between">
                                <span>{s._count?.transactions || 0} İşlem</span>
                                <span>Kayıt: {new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </AppLayout>
    );
}