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
import { ArrowUpRight, ArrowDownRight, Plus, Loader2, FileText, ScanBarcode, Truck, User, Calendar, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScanner from '@/components/BarcodeScanner';
import EmptyState from '@/components/EmptyState';
import { getQuickDateRange } from '@/lib/date-utils';
import { CustomLoader } from '@/components/ui/custom-loader';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Varsayılan olarak "Bu Ay" seçili gelsin
    const [dateRange, setDateRange] = useState(getQuickDateRange('THIS_MONTH'));

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
        } catch (e) {
            toast.error('Veriler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(); }, [dateRange]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.productId) {
            toast.warning("Lütfen bir ürün seçiniz.");
            return;
        }

        setSaving(true);
        try {
            await api.post('/transactions', {
                ...formData,
                quantity: Number(formData.quantity),
                supplierId: formData.type === 'INBOUND' ? formData.supplierId : null
            });

            setOpen(false);
            setFormData({ productId: '', type: 'INBOUND', quantity: 1, unit: 'PIECE', waybillNo: '', supplierId: '', notes: '' });
            fetchData();
            toast.success("İşlem başarıyla kaydedildi.");
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    const onBarcodeScanned = (code: string) => {
        setIsScannerOpen(false);
        const product = products.find(x => x.barcode === code);

        if (product) {
            setFormData({ ...formData, productId: product.id });
            setOpen(true);
            toast.success(`Ürün bulundu: ${product.name}`);
        } else {
            if (confirm('Barkod sistemde bulunamadı. Yeni ürün eklemek ister misiniz?')) {
                router.push('/products');
            }
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Stok Hareketleri</h1>
                    <p className="text-sm text-slate-500">Giriş, çıkış ve transfer geçmişi.</p>
                </div>

                <div className="flex gap-2 items-center flex-wrap">
                    {/* Tarih Filtreleri */}
                    <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md border p-1 rounded-lg shadow-sm">
                        <Calendar size={16} className="text-slate-400 ml-2" />
                        <Input
                            type="date"
                            className="h-8 w-32 border-none bg-transparent focus-visible:ring-0 px-1 text-xs"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="text-slate-300">-</span>
                        <Input
                            type="date"
                            className="h-8 w-32 border-none bg-transparent focus-visible:ring-0 px-1 text-xs"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>

                    <Button variant="outline" onClick={() => setIsScannerOpen(true)} className="bg-white/70">
                        <ScanBarcode className="mr-2 h-4 w-4" /> Tara
                    </Button>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800">
                                <Plus className="mr-2 h-4 w-4" /> Yeni İşlem
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Stok Hareketi</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4 mt-4">
                                {/* Giriş / Çıkış Seçimi */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setFormData({ ...formData, type: 'INBOUND' })}
                                        className={`p-4 border rounded-lg cursor-pointer text-center transition-all ${formData.type === 'INBOUND' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <ArrowDownRight className="mx-auto mb-2 h-6 w-6" /> Mal Kabul (Giriş)
                                    </div>
                                    <div
                                        onClick={() => setFormData({ ...formData, type: 'OUTBOUND' })}
                                        className={`p-4 border rounded-lg cursor-pointer text-center transition-all ${formData.type === 'OUTBOUND' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <ArrowUpRight className="mx-auto mb-2 h-6 w-6" /> Sevkiyat (Çıkış)
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Ürün</Label>
                                    <Select
                                        onValueChange={(val) => { if (val === 'NEW') router.push('/products'); else setFormData({ ...formData, productId: val }) }}
                                        value={formData.productId}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Seç..." /></SelectTrigger>
                                        <SelectContent>
                                            {products.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} {p.unitType === 'BOX' ? `(${p.itemsPerBox}li Koli)` : '(Adet)'} | Stok: {p.currentStock}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value="NEW" className="text-blue-600 border-t font-medium">+ Yeni Ürün Ekle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.type === 'INBOUND' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label>Tedarikçi</Label>
                                        <Select onValueChange={(val) => setFormData({ ...formData, supplierId: val })} value={formData.supplierId}>
                                            <SelectTrigger><SelectValue placeholder="Seç..." /></SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-1">
                                        <Label>Birim</Label>
                                        <Select value={formData.unit} onValueChange={(val) => setFormData({ ...formData, unit: val })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PIECE">Adet</SelectItem>
                                                <SelectItem value="BOX">Koli</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Miktar</Label>
                                        <Input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Belge No</Label>
                                    <Input value={formData.waybillNo} onChange={(e) => setFormData({ ...formData, waybillNo: e.target.value })} placeholder="İrsaliye vb." />
                                </div>

                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Not ekleyin..." />
                                </div>

                                <Button type="submit" className="w-full bg-slate-900" disabled={saving}>
                                    {saving ? <CustomLoader size="sm" className="mr-2" /> : 'Onayla'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isScannerOpen && <BarcodeScanner onScanSuccess={onBarcodeScanned} onClose={() => setIsScannerOpen(false)} />}

            <div className="bg-white/70 backdrop-blur-lg rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead>Tarih</TableHead>
                            <TableHead>İşlem</TableHead>
                            <TableHead>Ürün</TableHead>
                            <TableHead>Miktar</TableHead>
                            <TableHead>Kaynak/Hedef</TableHead>
                            <TableHead>Belge</TableHead>
                            <TableHead className="text-right">Yapan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Skeleton Loading
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : transactions.length === 0 ? (
                            // Empty State
                            <TableRow>
                                <TableCell colSpan={7} className="p-0">
                                    <EmptyState
                                        icon={ClipboardList}
                                        title="İşlem Bulunamadı"
                                        description="Seçilen tarih aralığında herhangi bir stok hareketi yok."
                                        actionLabel="Yeni İşlem Ekle"
                                        onAction={() => setOpen(true)}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            // Data Rows
                            transactions.map(tx => (
                                <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="text-xs text-slate-500 font-mono">
                                        {new Date(tx.createdAt).toLocaleDateString('tr-TR')}
                                        <span className="text-slate-400 ml-1">{new Date(tx.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tx.type === 'INBOUND' ? 'default' : 'destructive'} className={`gap-1 px-2 py-0.5 font-normal ${tx.type === 'INBOUND' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'}`}>
                                            {tx.type === 'INBOUND' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                                            {tx.type === 'INBOUND' ? 'GİRİŞ' : 'ÇIKIŞ'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900">{tx.product.name}</TableCell>
                                    <TableCell>
                                        <span className="font-bold text-slate-700">{tx.quantity}</span>
                                        <span className="text-xs text-slate-400 ml-1">Adet</span>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {tx.supplier ? (
                                            <div className="flex items-center gap-1 text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded w-fit">
                                                <Truck size={12} /> {tx.supplier.name}
                                            </div>
                                        ) : (
                                            <span className="italic text-slate-400 text-xs">{tx.notes || '-'}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {tx.waybillNo ? (
                                            <div className="flex items-center gap-1 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded border text-slate-600 w-fit">
                                                <FileText size={10} /> {tx.waybillNo}
                                            </div>
                                        ) : <span className="text-slate-300">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-slate-500">
                                        <div className="flex items-center justify-end gap-1">
                                            <User size={12} /> {tx.createdBy?.email}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}