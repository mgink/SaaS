'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Warehouse, Plus, Package, MapPin, Trash2, ArrowRightLeft, AlertCircle, X, Layers, Edit2, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState'; // <--- YENİ IMPORT

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

    const [form, setForm] = useState({ name: '', location: '', branchId: '', departments: [] as string[] });
    const [tempDept, setTempDept] = useState('');
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');

    const fetchData = async () => {
        try {
            const [wRes, bRes] = await Promise.all([api.get('/settings/warehouses'), api.get('/branches')]);
            setWarehouses(wRes.data); setBranches(bRes.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // ... (Create, Update, Delete, Transfer fonksiyonları aynı kalsın - Önceki kodla aynı) ...
    const addTempDept = () => { if (tempDept.trim()) { setForm({ ...form, departments: [...form.departments, tempDept.trim()] }); setTempDept(''); } };
    const removeTempDept = (i: number) => { setForm({ ...form, departments: form.departments.filter((_, idx) => idx !== i) }); };
    const handleCreate = async () => { if (!form.name) return; try { await api.post('/settings/warehouses', form); setForm({ name: '', location: '', branchId: '', departments: [] }); setIsCreateOpen(false); fetchData(); toast.success("Oluşturuldu."); } catch (e) { toast.error("Hata."); } };
    const handleUpdate = async () => { if (!form.name) return; try { await api.patch(`/settings/warehouses/${selectedWarehouse.id}`, { name: form.name, location: form.location, branchId: form.branchId }); setIsEditOpen(false); fetchData(); toast.success("Güncellendi."); } catch (e) { toast.error("Hata."); } };
    const openEdit = (w: any) => { setSelectedWarehouse(w); setForm({ name: w.name, location: w.location || '', branchId: w.branchId || '', departments: [] }); setIsEditOpen(true); }
    const handleDelete = async (id: string) => { if (!confirm('Silinsin mi?')) return; try { await api.delete(`/settings/warehouses/${id}`); fetchData(); toast.success("Silindi."); } catch (e: any) { toast.error(e.response?.data?.message || "Hata."); } }
    const handleTransfer = async () => { try { await api.post('/settings/warehouses/transfer', { fromId: transferFrom, toId: transferTo }); setIsTransferOpen(false); fetchData(); toast.success("Taşındı."); } catch (e) { toast.error("Hata."); } }

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-slate-900">Depo Yönetimi</h1><p className="text-sm text-slate-500">Lokasyon ve stok yönetimi.</p></div>
                <div className="flex gap-2">
                    <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}><DialogTrigger asChild><Button variant="outline"><ArrowRightLeft className="mr-2 h-4 w-4" /> Ürün Taşı</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Transfer</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><div className="bg-yellow-50 p-3 rounded border border-yellow-200 flex gap-2 text-sm text-yellow-700"><AlertCircle size={16} /><p>Tüm ürünler aktarılacak.</p></div><div className="space-y-2"><Label>Kaynak</Label><Select onValueChange={setTransferFrom}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name} ({w._count.products} Ürün)</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Hedef</Label><Select onValueChange={setTransferTo}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div><Button onClick={handleTransfer} className="w-full">Transferi Başlat</Button></div></DialogContent></Dialog>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}><DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Yeni Depo</Button></DialogTrigger><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Yeni Depo</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><div className="space-y-2"><Label>Ad</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-2"><Label>Konum</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div><div className="space-y-2"><Label>Şube</Label><Select onValueChange={(val) => setForm({ ...form, branchId: val })}><SelectTrigger><SelectValue placeholder="Seç (Opsiyonel)" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Departmanlar</Label><div className="flex gap-2"><Input placeholder="Raf A..." value={tempDept} onChange={e => setTempDept(e.target.value)} /><Button variant="secondary" onClick={addTempDept} type="button"><Plus size={16} /></Button></div><div className="flex flex-wrap gap-2 mt-2">{form.departments.map((d, i) => (<Badge key={i} variant="secondary" className="gap-1">{d}<X size={12} className="cursor-pointer" onClick={() => removeTempDept(i)} /></Badge>))}</div></div><Button onClick={handleCreate} className="w-full bg-slate-900">Oluştur</Button></div></DialogContent></Dialog>
                </div>
            </div>

            {warehouses.length === 0 && !loading ? (
                // --- EMPTY STATE ---
                <EmptyState
                    icon={Warehouse}
                    title="Depo Bulunamadı"
                    description="Henüz hiç depo tanımlanmamış. İlk deponuzu oluşturarak başlayın."
                    actionLabel="+ İlk Depoyu Ekle"
                    onAction={() => setIsCreateOpen(true)}
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {warehouses.map((w) => (
                        <Card key={w.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 group relative bg-white/70 backdrop-blur">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(w)}><Edit2 size={16} /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(w.id)}><Trash2 size={16} /></Button></div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-lg font-bold flex items-center gap-2"><Warehouse className="text-slate-400" size={20} /> {w.name}</CardTitle></CardHeader>
                            <CardContent>
                                {w.branch && <div className="mb-2"><Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1"><GitBranch size={12} /> {w.branch.name}</Badge></div>}
                                <div className="flex items-center gap-4 mt-2 mb-4"><div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"><Package size={16} />{w._count?.products || 0} Ürün</div></div>
                                {w.departments && w.departments.length > 0 && (<div className="flex flex-wrap gap-1 mb-3">{w.departments.map((d: any) => (<span key={d.id} className="text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded text-slate-600 flex items-center gap-1"><Layers size={10} /> {d.name}</span>))}</div>)}
                                <div className="mt-auto pt-4 border-t flex justify-between items-center text-xs text-slate-400"><div className="flex items-center gap-1"><MapPin size={12} /> {w.location || 'Merkez'}</div></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Depoyu Düzenle</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><div className="space-y-2"><Label>Depo Adı</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="space-y-2"><Label>Konum</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div><div className="space-y-2"><Label>Bağlı Şube</Label><Select value={form.branchId} onValueChange={(val) => setForm({ ...form, branchId: val })}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div><Button onClick={handleUpdate} className="w-full bg-slate-900">Güncelle</Button></div></DialogContent></Dialog>
        </AppLayout>
    );
}