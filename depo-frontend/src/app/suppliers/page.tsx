'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Phone, MapPin, Edit2, Trash2, Truck, User, FileText, History, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Ekleme/Düzenleme State'leri
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const initialForm = { name: '', contactName: '', phone: '', email: '', address: '', category: '' };
    const [formData, setFormData] = useState(initialForm);

    // DETAY MODALI STATE'LERİ
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    // DETAYLARI ÇEKME FONKSİYONU
    const openDetail = async (supplier: any) => {
        setDetailOpen(true);
        setDetailLoading(true);
        try {
            const res = await api.get(`/suppliers/${supplier.id}`);
            setSelectedSupplier(res.data);
        } catch (e) {
            toast.error("Detaylar yüklenemedi.");
            setDetailOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

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
                    <Card key={s.id} className="group relative hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm border border-slate-100 cursor-pointer" onClick={() => openDetail(s)}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white shadow-sm" onClick={(e) => { e.stopPropagation(); openEdit(s); }}><Edit2 size={16} /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 text-red-500 hover:bg-red-50 shadow-sm" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}><Trash2 size={16} /></Button>
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
                            <div className="mt-4 pt-4 border-t text-xs text-slate-400 flex justify-between items-center">
                                <span className="flex items-center gap-1"><History size={12} /> {s._count?.transactions || 0} İşlem</span>
                                <span className="text-blue-600 font-medium">Detaylar &rarr;</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* --- TEDARİKÇİ DETAY POPUP --- */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                    {detailLoading ? (
                        <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>
                    ) : selectedSupplier ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2"><Truck className="text-blue-600" /> {selectedSupplier.name}</DialogTitle>
                                <div className="text-sm text-slate-500 flex gap-4 mt-1">
                                    {selectedSupplier.phone && <span>📞 {selectedSupplier.phone}</span>}
                                    {selectedSupplier.email && <span>✉️ {selectedSupplier.email}</span>}
                                </div>
                            </DialogHeader>

                            <Tabs defaultValue="history" className="w-full mt-4">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="history">İşlem Geçmişi</TabsTrigger>
                                    <TabsTrigger value="products">Verdiği Ürünler</TabsTrigger>
                                </TabsList>

                                {/* SEKME 1: İŞLEM GEÇMİŞİ */}
                                <TabsContent value="history" className="mt-4">
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50"><TableRow><TableHead>Tarih</TableHead><TableHead>Ürün</TableHead><TableHead>Miktar</TableHead><TableHead>Tutar</TableHead><TableHead>Belge</TableHead><TableHead className="text-right">Durum</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {selectedSupplier.transactions?.length === 0 ? (
                                                    <TableRow><TableCell colSpan={6} className="text-center h-24 text-slate-500">Bu tedarikçiyle henüz işlem yapılmamış.</TableCell></TableRow>
                                                ) : (
                                                    selectedSupplier.transactions?.map((tx: any) => (
                                                        <TableRow key={tx.id}>
                                                            <TableCell className="text-xs font-mono">{new Date(tx.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                                                            <TableCell className="font-medium">{tx.product?.name}</TableCell>
                                                            <TableCell>{tx.quantity}</TableCell>
                                                            <TableCell>{(tx.quantity * (tx.product?.buyingPrice || 0)).toLocaleString()} ₺</TableCell>
                                                            <TableCell><span className="text-xs text-slate-500">{tx.waybillNo || '-'}</span></TableCell>
                                                            <TableCell className="text-right">
                                                                {tx.isCash ? (
                                                                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Peşin</Badge>
                                                                ) : tx.isPaid ? (
                                                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 flex w-fit ml-auto items-center gap-1"><CheckCircle2 size={10} /> Ödendi</Badge>
                                                                ) : (
                                                                    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 flex w-fit ml-auto items-center gap-1"><XCircle size={10} /> Vadeli</Badge>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* SEKME 2: ÜRÜNLER */}
                                <TabsContent value="products" className="mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedSupplier.products?.map((p: any) => (
                                            <div key={p.id} className="border p-3 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{p.name}</div>
                                                    <div className="text-xs text-slate-500">{p.sku}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-green-600">{p.buyingPrice} ₺</div>
                                                    <div className="text-xs text-slate-400">Alış</div>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedSupplier.products?.length === 0 && <div className="col-span-2 text-center text-slate-500 py-8">Tanımlı ürün yok.</div>}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}