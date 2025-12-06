'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useMultipleDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Truck, User, Save, ArrowDownRight, ArrowUpRight, AlertTriangle, FilePlus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { CustomLoader } from '@/components/ui/custom-loader';
import EmptyState from '@/components/EmptyState';

export default function StockFormsPage() {
    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'forms', url: '/stock-forms' },
        { key: 'products', url: '/products' },
        { key: 'suppliers', url: '/suppliers' }
    ]);

    const forms = data.forms || [];
    const products = data.products || [];
    const suppliers = data.suppliers || [];
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fiş Formu State'i
    const [formData, setFormData] = useState({
        type: 'INBOUND', // INBOUND, OUTBOUND, WASTAGE
        supplierId: '',
        waybillNo: '',
        waybillDate: '',
        notes: '',
        items: [] as any[] // { productId, quantity, unit, ... }
    });

    // Geçici Satır State'i (Yeni eklenecek ürün)
    const [tempItem, setTempItem] = useState({
        productId: '',
        quantity: 1,
        unit: 'PIECE',
        productName: '',
        productSku: ''
    });



    // SATIR EKLEME
    const addItem = () => {
        if (!tempItem.productId) {
            toast.warning("Lütfen bir ürün seçin.");
            return;
        }
        const product = products.find((p: any) => p.id === tempItem.productId);

        // Listeye ekle
        setFormData({
            ...formData,
            items: [...formData.items, { ...tempItem, productName: product.name, productSku: product.sku }]
        });

        // Geçici satırı sıfırla
        setTempItem({ productId: '', quantity: 1, unit: 'PIECE', productName: '', productSku: '' });
    };

    // SATIR SİLME
    const removeItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    // KAYDETME
    const handleSave = async () => {
        if (formData.items.length === 0) {
            toast.warning("Fiş boş olamaz, en az bir ürün ekleyin.");
            return;
        }

        setSaving(true);
        try {
            await api.post('/stock-forms', formData);
            toast.success("Stok fişi başarıyla oluşturuldu ve işlendi.");
            setOpen(false);
            // Formu sıfırla
            setFormData({ type: 'INBOUND', supplierId: '', waybillNo: '', waybillDate: '', notes: '', items: [] });
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Stok Fişleri (Toplu İşlem)</h1>
                    <p className="text-sm text-slate-500">Birden fazla ürünü tek seferde giriş veya çıkış yapın.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800"><FilePlus className="mr-2 h-4 w-4" /> Yeni Fiş Oluştur</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl">
                        <DialogHeader><DialogTitle>Yeni Stok Fişi</DialogTitle></DialogHeader>

                        <div className="space-y-6 mt-4">
                            {/* 1. FİŞ BAŞLIĞI */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="space-y-2">
                                    <Label>İşlem Tipi</Label>
                                    <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INBOUND">Giriş (Mal Kabul)</SelectItem>
                                            <SelectItem value="OUTBOUND">Çıkış (Sevkiyat)</SelectItem>
                                            <SelectItem value="WASTAGE">Zayi / Fire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.type === 'INBOUND' && (
                                    <div className="space-y-2 animate-in fade-in">
                                        <Label>Tedarikçi</Label>
                                        <Select value={formData.supplierId} onValueChange={(val) => setFormData({ ...formData, supplierId: val })}>
                                            <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                            <SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Belge No & Tarih</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="İrsaliye No" value={formData.waybillNo} onChange={e => setFormData({ ...formData, waybillNo: e.target.value })} />
                                        <Input type="date" value={formData.waybillDate} onChange={e => setFormData({ ...formData, waybillDate: e.target.value })} />
                                    </div>
                                </div>

                                <div className="md:col-span-3 space-y-2">
                                    <Label>Açıklama</Label>
                                    <Input placeholder="Fiş hakkında genel açıklama..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                            </div>

                            {/* 2. SATIR EKLEME ALANI */}
                            <div className="flex gap-2 items-end bg-white p-3 border rounded-lg shadow-sm">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Ürün Ekle</Label>
                                    <Select value={tempItem.productId} onValueChange={(val) => setTempItem({ ...tempItem, productId: val })}>
                                        <SelectTrigger><SelectValue placeholder="Ürün Seç..." /></SelectTrigger>
                                        <SelectContent>
                                            {products.map((p: any) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} <span className="text-slate-400 text-xs">({p.sku}) | Stok: {p.currentStock}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-24 space-y-1">
                                    <Label className="text-xs">Miktar</Label>
                                    <Input type="number" min="1" value={tempItem.quantity} onChange={e => setTempItem({ ...tempItem, quantity: Number(e.target.value) })} />
                                </div>
                                <div className="w-28 space-y-1">
                                    <Label className="text-xs">Birim</Label>
                                    <Select value={tempItem.unit} onValueChange={(val) => setTempItem({ ...tempItem, unit: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PIECE">Adet</SelectItem>
                                            <SelectItem value="BOX">Koli</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus size={18} /></Button>
                            </div>

                            {/* 3. EKLENENLER LİSTESİ */}
                            <div className="border rounded-lg overflow-hidden bg-white">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead>Ürün Adı</TableHead>
                                            <TableHead>Kod</TableHead>
                                            <TableHead>Miktar</TableHead>
                                            <TableHead className="text-right">İşlem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.items.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center h-24 text-slate-400 italic">Henüz ürün eklenmedi. Listeye ürün ekleyin.</TableCell></TableRow>
                                        ) : (
                                            formData.items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                                    <TableCell className="text-xs font-mono text-slate-500">{item.productSku}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-bold text-sm">
                                                            {item.quantity} {item.unit === 'BOX' ? 'Koli' : 'Adet'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-50">
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 w-32" disabled={saving}>
                                {saving ? <CustomLoader size="sm" className="mr-2" /> : <><Save className="mr-2 h-4 w-4" /> Kaydet</>}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* FİŞ LİSTESİ */}
            <div className="bg-white/80 backdrop-blur-lg rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead>Fiş No</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead>İşlem Tipi</TableHead>
                            <TableHead>Tedarikçi / Açıklama</TableHead>
                            <TableHead>Kalem Sayısı</TableHead>
                            <TableHead className="text-right">Oluşturan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center"><CustomLoader /></TableCell></TableRow>
                        ) : forms.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="p-0 border-none"><EmptyState icon={FileText} title="Kayıtlı Fiş Yok" description="Henüz toplu giriş/çıkış fişi oluşturulmamış." actionLabel="Yeni Fiş Oluştur" onAction={() => setOpen(true)} /></TableCell></TableRow>
                        ) : (
                            forms.map((form: any) => (
                                <TableRow key={form.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono font-bold text-xs text-slate-700">{form.formNumber}</TableCell>
                                    <TableCell className="text-slate-500 text-xs flex items-center gap-1">
                                        <Calendar size={12} /> {new Date(form.createdAt).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`gap-1 px-2 font-normal ${form.type === 'INBOUND' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' :
                                                form.type === 'WASTAGE' ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' :
                                                    'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
                                            }`}>
                                            {form.type === 'INBOUND' ? <ArrowDownRight size={12} className="mr-1" /> : (form.type === 'WASTAGE' ? <AlertTriangle size={12} className="mr-1" /> : <ArrowUpRight size={12} className="mr-1" />)}
                                            {form.type === 'INBOUND' ? 'Giriş Fişi' : (form.type === 'WASTAGE' ? 'Zayi Fişi' : 'Çıkış Fişi')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {form.supplier ? <div className="flex items-center gap-1 font-medium text-indigo-600"><Truck size={14} /> {form.supplier.name}</div> : <span className="italic">{form.notes || '-'}</span>}
                                    </TableCell>
                                    {/* HATA DÜZELTME: form._count?.transactions || 0 */}
                                    <TableCell><Badge variant="outline" className="bg-slate-50 text-slate-600">{form._count?.transactions || 0} Kalem</Badge></TableCell>
                                    <TableCell className="text-right text-xs text-slate-400"><div className="flex items-center justify-end gap-1"><User size={12} /> {form.createdBy?.fullName}</div></TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}