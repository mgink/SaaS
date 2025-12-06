'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useMultipleDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Phone, MapPin, Edit2, Trash2, Truck, User, History, CheckCircle2, XCircle, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function SuppliersPage() {
    const [filterOverdue, setFilterOverdue] = useState(false);

    // Fetch suppliers and finance data using custom hook
    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'suppliers', url: '/suppliers' },
        { key: 'finance', url: '/transactions/finance' }
    ]);

    const suppliers = data.suppliers || [];
    const financeData = data.finance || { unpaidTransactions: [] };

    // ... (Ekleme/Düzenleme State'leri aynı)
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const initialForm = { name: '', contactName: '', phone: '', email: '', address: '', category: '' };
    const [formData, setFormData] = useState(initialForm);

    // Detay Modalı
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Tedarikçinin borç durumunu hesapla
    const getSupplierDebtStatus = (supplierId: string) => {
        const debts = financeData.unpaidTransactions.filter((tx: any) => tx.supplierId === supplierId);
        return { hasOverdue: false, totalDebt: 0 };
    };

    // Backend servisini güncellemediysek bu özellik tam çalışmaz. 
    // Frontend tarafında basit filtreleme yapalım.

    const filteredSuppliers = filterOverdue
        ? suppliers.filter(s => {
            // Burada tedarikçinin gecikmiş borcu olup olmadığını anlamak için detay verisine ihtiyaç var.
            // Listeleme endpointi (findAll) transaction count dönüyor ama detay dönmüyor.
            // Bu yüzden "Vadesi Geçenler" filtresi için finance verisini kullanacağız.
            const supplierDebts = financeData.unpaidTransactions.filter((tx: any) => tx.supplier === s.name);
            return supplierDebts.some((tx: any) => tx.isOverdue);
        })
        : suppliers;

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

    // ... (handleSubmit, handleDelete, openEdit aynı) ...
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { if (isEdit) await api.patch(`/suppliers/${selectedId}`, formData); else await api.post('/suppliers', formData); setOpen(false); setFormData(initialForm); setIsEdit(false); refetch(); toast.success("Kaydedildi."); } catch (e) { toast.error("Hata."); } };
    const handleDelete = async (id: string) => { if (!confirm("Silinsin mi?")) return; try { await api.delete(`/suppliers/${id}`); refetch(); toast.success("Silindi."); } catch (e: any) { toast.error("Hata."); } }
    const openEdit = (s: any) => { setFormData({ name: s.name, contactName: s.contactName || '', phone: s.phone || '', email: s.email || '', address: s.address || '', category: s.category || '' }); setSelectedId(s.id); setIsEdit(true); setOpen(true); }


    return (
        <AppLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div><h1 className="text-2xl font-bold text-slate-900">Tedarikçiler</h1><p className="text-sm text-slate-500">Tedarik zinciri yönetimi.</p></div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center space-x-2 border px-3 py-2 rounded-md transition-colors ${filterOverdue ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                        <Switch id="overdue" checked={filterOverdue} onCheckedChange={setFilterOverdue} />
                        <Label htmlFor="overdue" className={`font-bold cursor-pointer flex items-center gap-1 ${filterOverdue ? 'text-red-600' : 'text-slate-600'}`}><AlertCircle size={14} /> Vadesi Geçenler</Label>
                    </div>

                    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setIsEdit(false); setFormData(initialForm); } }}>
                        <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Yeni Tedarikçi</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader><DialogTitle>{isEdit ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}</DialogTitle></DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                                <div className="space-y-2"><Label>Firma Adı *</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: Bereket Gıda" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Kategori</Label><Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Gıda">Gıda</SelectItem><SelectItem value="İçecek">İçecek</SelectItem><SelectItem value="Ambalaj">Ambalaj</SelectItem><SelectItem value="Diğer">Diğer</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Yetkili Kişi</Label><Input value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Telefon</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div><div className="space-y-2"><Label>E-posta</Label><Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div></div>
                                <div className="space-y-2"><Label>Adres</Label><Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                                <Button type="submit" className="w-full bg-slate-900">{isEdit ? 'Güncelle' : 'Kaydet'}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSuppliers.map((s: any) => {
                    // Tedarikçinin borç durumunu financeData'dan bul
                    const debts = financeData.unpaidTransactions?.filter((tx: any) => tx.supplier === s.name) || [];
                    const hasOverdue = debts.some((tx: any) => tx.isOverdue);
                    const totalDebt = debts.reduce((acc: number, tx: any) => acc + tx.amount, 0);

                    return (
                        <Card key={s.id} className={`group relative hover:shadow-lg transition-all cursor-pointer bg-white/70 backdrop-blur-sm ${hasOverdue ? 'border-2 border-red-500 shadow-red-100' : 'border border-slate-100'}`} onClick={() => openDetail(s)}>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white shadow-sm" onClick={(e) => { e.stopPropagation(); openEdit(s); }}><Edit2 size={16} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 text-red-500 hover:bg-red-50 shadow-sm" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}><Trash2 size={16} /></Button>
                            </div>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg flex items-center gap-2"><Truck className="text-blue-600" size={20} /> {s.name}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline" className="bg-slate-50">{s.category || 'Genel'}</Badge>
                                            {hasOverdue && <Badge className="bg-red-100 text-red-600 border-red-200 flex items-center gap-1"><AlertCircle size={10} /> Ödeme Gecikti</Badge>}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-slate-600">
                                    {s.contactName && <div className="flex items-center gap-2"><User size={14} className="text-slate-400" /> {s.contactName}</div>}
                                    {s.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {s.phone}</div>}
                                </div>

                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    {totalDebt > 0 ? (
                                        <div className="text-red-600 font-bold text-sm flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-normal">Toplam Borç</span>
                                            {totalDebt.toLocaleString()} ₺
                                        </div>
                                    ) : (
                                        <div className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 size={12} /> Borç Yok</div>
                                    )}
                                    <span className="text-xs text-slate-400 flex items-center gap-1"><History size={12} /> {s._count?.transactions || 0} İşlem</span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* --- TEDARİKÇİ DETAY POPUP --- */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                    {detailLoading ? <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div> : selectedSupplier ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2"><Truck className="text-blue-600" /> {selectedSupplier.name}</DialogTitle>
                                <div className="text-sm text-slate-500 flex gap-4 mt-1">{selectedSupplier.phone && <span>📞 {selectedSupplier.phone}</span>}{selectedSupplier.email && <span>✉️ {selectedSupplier.email}</span>}</div>
                            </DialogHeader>

                            <Tabs defaultValue="debts" className="w-full mt-4">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="debts" className="data-[state=active]:text-red-600">Borçlar & Ödemeler</TabsTrigger>
                                    <TabsTrigger value="history">Geçmiş İşlemler</TabsTrigger>
                                    <TabsTrigger value="products">Ürünler</TabsTrigger>
                                </TabsList>

                                {/* SEKME 1: BORÇLAR (ÖDENMEMİŞLER) */}
                                <TabsContent value="debts" className="mt-4">
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-red-50"><TableRow><TableHead>Vade</TableHead><TableHead>Ürün</TableHead><TableHead>Tutar</TableHead><TableHead className="text-right">Durum</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {selectedSupplier.transactions?.filter((t: any) => !t.isPaid && !t.isCash).length === 0 ? (
                                                    <TableRow><TableCell colSpan={4} className="text-center h-20 text-green-600 font-medium">Bu tedarikçiye borcunuz yok. 🎉</TableCell></TableRow>
                                                ) : (
                                                    selectedSupplier.transactions?.filter((t: any) => !t.isPaid && !t.isCash).map((tx: any) => {
                                                        const isOverdue = tx.paymentDate && new Date(tx.paymentDate) < new Date();
                                                        return (
                                                            <TableRow key={tx.id} className={isOverdue ? 'bg-red-50/50' : ''}>
                                                                <TableCell className={`text-xs font-mono ${isOverdue ? 'text-red-600 font-bold' : ''}`}>{tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString() : '-'}</TableCell>
                                                                <TableCell>{tx.product?.name}</TableCell>
                                                                <TableCell className="font-bold">{(tx.quantity * (tx.product?.buyingPrice || 0)).toLocaleString()} ₺</TableCell>
                                                                <TableCell className="text-right">{isOverdue ? <Badge variant="destructive">GECİKMİŞ</Badge> : <Badge variant="outline">Bekliyor</Badge>}</TableCell>
                                                            </TableRow>
                                                        )
                                                    })
                                                )}
                                                {/* Toplam Borç Satırı */}
                                                {selectedSupplier.transactions?.filter((t: any) => !t.isPaid && !t.isCash).length > 0 && (
                                                    <TableRow className="bg-slate-50 font-bold">
                                                        <TableCell colSpan={2} className="text-right">TOPLAM VADELİ BORÇ:</TableCell>
                                                        <TableCell colSpan={2} className="text-red-600 text-lg">
                                                            {selectedSupplier.transactions?.filter((t: any) => !t.isPaid && !t.isCash).reduce((acc: number, tx: any) => acc + (tx.quantity * (tx.product?.buyingPrice || 0)), 0).toLocaleString()} ₺
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* SEKME 2: GEÇMİŞ İŞLEMLER */}
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

                                {/* SEKME 3: ÜRÜNLER */}
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