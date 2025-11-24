'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    ArrowUpRight, ArrowDownRight, Plus, Loader2, FileText,
    ScanBarcode, Truck, User, Calendar, ClipboardList, FilterX
} from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScanner from '@/components/BarcodeScanner';
import EmptyState from '@/components/EmptyState';
import { getQuickDateRange } from '@/lib/date-utils';

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtreler
    const [dateRange, setDateRange] = useState(getQuickDateRange('THIS_MONTH'));
    const [activeFilter, setActiveFilter] = useState<string>('THIS_MONTH');

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const [formData, setFormData] = useState({
        productId: '', type: 'INBOUND', quantity: 1, unit: 'PIECE',
        waybillNo: '', supplierId: '', notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = '';
            if (dateRange.start && dateRange.end) {
                query = `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }

            const [txRes, prodRes, supRes] = await Promise.all([
                api.get(`/transactions${query}`),
                api.get('/products'),
                api.get('/suppliers')
            ]);
            setTransactions(txRes.data);
            setProducts(prodRes.data.filter((p: any) => p.status === 'APPROVED'));
            setSuppliers(supRes.data);
        } catch (error) { toast.error('Veriler yüklenirken hata oluştu.'); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [dateRange]);

    // Hızlı Tarih Seçimi
    const setQuickDate = (type: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH') => {
        setActiveFilter(type);
        setDateRange(getQuickDateRange(type));
    };

    const handleManualDateChange = (field: 'start' | 'end', value: string) => {
        setActiveFilter('CUSTOM');
        setDateRange(prev => ({ ...prev, [field]: value }));
    };

    const clearFilters = () => {
        setQuickDate('THIS_MONTH');
        toast.info("Filtreler temizlendi.");
    }

    const onBarcodeScanned = (code: string) => {
        setIsScannerOpen(false);
        const product = products.find(p => p.barcode === code);
        if (product) { setFormData({ ...formData, productId: product.id }); setOpen(true); toast.success(`Ürün bulundu: ${product.name}`); }
        else { if (confirm('Ürün bulunamadı. Yeni ürün eklemek ister misiniz?')) router.push('/products'); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            const res = await api.post('/transactions', {
                ...formData, quantity: Number(formData.quantity),
                supplierId: formData.type === 'INBOUND' ? formData.supplierId : null
            });
            setOpen(false); setFormData({ productId: '', type: 'INBOUND', quantity: 1, unit: 'PIECE', waybillNo: '', supplierId: '', notes: '' });
            fetchData();
            if (res.data.isRequest) toast.info("Yetkiniz olmadığı için TALEP olarak oluşturuldu.");
            else toast.success("Kaydedildi.");
        } catch (e) { toast.error('İşlem başarısız!'); } finally { setSaving(false); }
    };

    return (
        <AppLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div><h1 className="text-2xl font-bold text-slate-900">Stok Hareketleri</h1><p className="text-sm text-slate-500">Giriş, çıkış ve transferler.</p></div>

                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white/60 backdrop-blur-md p-1.5 rounded-xl border shadow-sm">
                    {/* HIZLI TARİH */}
                    <div className="flex bg-slate-100/50 p-1 rounded-lg gap-1">
                        <Button variant={activeFilter === 'TODAY' ? 'default' : 'ghost'} size="sm" className="h-8 text-xs px-3" onClick={() => setQuickDate('TODAY')}>Bugün</Button>
                        <Button variant={activeFilter === 'THIS_WEEK' ? 'default' : 'ghost'} size="sm" className="h-8 text-xs px-3" onClick={() => setQuickDate('THIS_WEEK')}>Hafta</Button>
                        <Button variant={activeFilter === 'THIS_MONTH' ? 'default' : 'ghost'} size="sm" className="h-8 text-xs px-3" onClick={() => setQuickDate('THIS_MONTH')}>Ay</Button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

                    {/* TARİH SEÇİCİ */}
                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={16} className="text-slate-400 ml-2" />
                        <Input type="date" className="h-8 w-auto border-none bg-transparent focus-visible:ring-0 px-1 text-xs p-0" value={dateRange.start} onChange={e => handleManualDateChange('start', e.target.value)} />
                        <span className="text-slate-300">-</span>
                        <Input type="date" className="h-8 w-auto border-none bg-transparent focus-visible:ring-0 px-1 text-xs p-0" value={dateRange.end} onChange={e => handleManualDateChange('end', e.target.value)} />
                    </div>

                    {activeFilter === 'CUSTOM' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={clearFilters}><FilterX size={16} /></Button>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsScannerOpen(true)}><ScanBarcode className="mr-2 h-4 w-4" /> Tara</Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild><Button className="bg-slate-900 hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> Yeni İşlem</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader><DialogTitle>Stok Hareketi</DialogTitle></DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 border rounded-md cursor-pointer text-center font-bold transition-all ${formData.type === 'INBOUND' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-500'}`} onClick={() => setFormData({ ...formData, type: 'INBOUND' })}><ArrowDownRight className="mx-auto mb-2" /> Mal Kabul</div>
                                    <div className={`p-4 border rounded-md cursor-pointer text-center font-bold transition-all ${formData.type === 'OUTBOUND' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-500'}`} onClick={() => setFormData({ ...formData, type: 'OUTBOUND' })}><ArrowUpRight className="mx-auto mb-2" /> Sevkiyat</div>
                                </div>
                                <div className="space-y-2"><Label>Ürün</Label><Select onValueChange={(val) => { if (val === 'NEW') router.push('/products'); else setFormData({ ...formData, productId: val }) }} value={formData.productId}><SelectTrigger><SelectValue placeholder="Seç..." /></SelectTrigger><SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} {p.unitType === 'BOX' ? `(${p.itemsPerBox}li)` : ''}</SelectItem>))}<SelectItem value="NEW" className="text-blue-600 border-t">+ Yeni Ürün Tanımla</SelectItem></SelectContent></Select></div>
                                {formData.type === 'INBOUND' && (<div className="space-y-2 animate-in fade-in"><Label>Tedarikçi</Label><Select onValueChange={(val) => setFormData({ ...formData, supplierId: val })} value={formData.supplierId}><SelectTrigger><SelectValue placeholder="Seç..." /></SelectTrigger><SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>)}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1"><Label>Birim</Label><Select value={formData.unit} onValueChange={(val) => setFormData({ ...formData, unit: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PIECE">Adet</SelectItem><SelectItem value="BOX">Koli</SelectItem></SelectContent></Select></div>
                                    <div className="col-span-2"><Label>Miktar</Label><Input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} /></div>
                                </div>
                                <div className="space-y-2"><Label>Belge No</Label><Input value={formData.waybillNo} onChange={(e) => setFormData({ ...formData, waybillNo: e.target.value })} /></div>
                                <Button type="submit" className="w-full bg-slate-900" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : 'Onayla'}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isScannerOpen && <BarcodeScanner onScanSuccess={onBarcodeScanned} onClose={() => setIsScannerOpen(false)} />}

            <div className="bg-white/80 backdrop-blur-lg rounded-md border border-slate-200 shadow-sm">
                <Table>
                    <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>İşlem</TableHead><TableHead>Ürün</TableHead><TableHead>Miktar</TableHead><TableHead>Kaynak/Hedef</TableHead><TableHead>Belge</TableHead><TableHead className="text-right">Yapan</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? (<TableRow><TableCell colSpan={7} className="text-center h-24">Yükleniyor...</TableCell></TableRow>) : transactions.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="p-0 border-none"><EmptyState icon={ClipboardList} title="İşlem Yok" description="Seçilen tarih aralığında işlem bulunamadı." actionLabel="Tümünü Göster" onAction={clearFilters} /></TableCell></TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-slate-500 text-xs">{new Date(tx.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell><Badge variant={tx.type === 'INBOUND' ? 'default' : 'destructive'} className="gap-1">{tx.type === 'INBOUND' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}{tx.type === 'INBOUND' ? 'GİRİŞ' : 'ÇIKIŞ'}</Badge></TableCell>
                                    <TableCell className="font-medium">{tx.product.name}</TableCell>
                                    <TableCell className="font-bold">{tx.quantity} <span className="text-xs font-normal text-slate-500">Adet</span></TableCell>
                                    <TableCell className="text-sm text-slate-600">{tx.supplier ? <div className="flex items-center gap-1 text-indigo-600 font-medium"><Truck size={14} /> {tx.supplier.name}</div> : <span className="italic text-slate-400">{tx.notes || '-'}</span>}</TableCell>
                                    <TableCell>{tx.waybillNo && <span className="flex items-center gap-1 text-xs font-mono bg-slate-100 px-1 rounded w-fit"><FileText size={10} /> {tx.waybillNo}</span>}</TableCell>
                                    <TableCell className="text-right text-xs text-slate-400"><div className="flex items-center justify-end gap-1"><User size={12} /> {tx.createdBy?.email}</div></TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}