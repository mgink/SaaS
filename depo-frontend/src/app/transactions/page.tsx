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
import { Switch } from "@/components/ui/switch";
import {
    ArrowUpRight, ArrowDownRight, Plus, Loader2, FileText,
    ScanBarcode, Truck, User, Calendar, ClipboardList,
    Trash2, AlertTriangle, PackagePlus, Check, X, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScanner from '@/components/BarcodeScanner';
import EmptyState from '@/components/EmptyState';
import { getQuickDateRange } from '@/lib/date-utils';
import { CustomLoader } from '@/components/ui/custom-loader';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsPage() {
    const router = useRouter();

    // --- VERİ STATE ---
    const [transactions, setTransactions] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('VIEWER');

    // --- FİLTRE STATE ---
    const [dateRange, setDateRange] = useState(getQuickDateRange('THIS_MONTH'));

    // --- MODAL STATE ---
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // --- FORM STATE (STOCK FORM / FİŞ MANTIGINA GÖRE) ---
    // Üst Bilgiler
    const [formData, setFormData] = useState({
        type: 'INBOUND', // INBOUND, OUTBOUND, WASTAGE
        supplierId: '',
        waybillNo: '',
        isReceived: true, // Mal fiziki olarak geldi mi?
        notes: '',
        items: [] as any[] // Kalemler
    });

    // Geçici Satır (Eklenecek ürün)
    const [tempItem, setTempItem] = useState({
        productId: '',
        quantity: 1,
        unit: 'PIECE',
        productName: '',
        stock: 0,
        sku: ''
    });

    // --- VERİ ÇEKME ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const localUser = localStorage.getItem('user');
            if (localUser) setUserRole(JSON.parse(localUser).role || 'VIEWER');

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
            // Sadece onaylı ürünler işlem görebilir
            setProducts(prodRes.data.filter((p: any) => p.status === 'APPROVED'));
            setSuppliers(supRes.data);
        } catch (e) {
            toast.error('Veriler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(); }, [dateRange]);

    // --- SATIR İŞLEMLERİ (FORM İÇİ) ---
    const addItem = () => {
        if (!tempItem.productId) { toast.warning("Ürün seçmelisiniz."); return; }

        // Listeye ekle
        setFormData({
            ...formData,
            items: [...formData.items, { ...tempItem }]
        });

        // Geçici alanı temizle
        setTempItem({ productId: '', quantity: 1, unit: 'PIECE', productName: '', stock: 0, sku: '' });
    };

    const removeItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    // --- KAYDETME (STOK FİŞİ OLARAK) ---
    const handleSave = async () => {
        if (formData.items.length === 0) {
            toast.warning("En az bir ürün eklemelisiniz.");
            return;
        }

        setSaving(true);
        try {
            // Backend'de StockForm servisine gönderiyoruz
            await api.post('/stock-forms', formData);

            setOpen(false);
            // Formu sıfırla
            setFormData({ type: 'INBOUND', supplierId: '', waybillNo: '', isReceived: true, notes: '', items: [] });
            fetchData();
            toast.success("İşlem fişi başarıyla oluşturuldu.");
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'İşlem başarısız.');
        } finally {
            setSaving(false);
        }
    };

    // --- YÖNETİCİ ONAYI ---
    // Tekil Transaction Onaylama/Reddetme (Listeden Hızlı İşlem)
    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Bu işlemi ${status === 'APPROVED' ? 'ONAYLAMAK' : 'REDDETMEK'} istediğinize emin misiniz?`)) return;

        // Not: Backend'de Transaction update endpointi olmalı veya StockForm üzerinden gidilmeli.
        // Eğer tekil transaction endpointi yoksa, bu özellik çalışmaz.
        // Varsayım: api.patch('/transactions/:id') var.
        try {
            // Burada basit bir transaction update çağırıyoruz.
            // Eğer backend'de özel endpoint yoksa eklenebilir.
            // Şimdilik "Not implemented" uyarısı vermemek için mock yapıyoruz.
            toast.info("Bu özellik için backend endpoint kontrolü gerekli.");
            // Gerçek implementasyon: await api.patch(`/transactions/${id}`, { status }); fetchData();
        } catch (e) {
            toast.error("Hata.");
        }
    };

    // --- BARKOD ---
    const onBarcodeScanned = (code: string) => {
        setIsScannerOpen(false);
        const product = products.find(x => x.barcode === code);

        if (product) {
            // Barkod okununca direkt ekleme satırına ürünü seç
            setTempItem({
                productId: product.id,
                productName: product.name,
                stock: product.currentStock,
                sku: product.sku,
                quantity: 1,
                unit: 'PIECE'
            });
            setOpen(true); // Modalı aç
            toast.success(`Ürün bulundu: ${product.name}`);
        } else {
            if (confirm('Barkod sistemde bulunamadı. Yeni ürün eklemek ister misiniz?')) {
                router.push('/products');
            }
        }
    };

    // Yetki Kontrolü
    const canManage = ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'].includes(userRole);

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
                        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50/95 backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle>Stok İşlem Fişi</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* 1. BAŞLIK BİLGİLERİ */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border shadow-sm">

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
                                                <SelectContent>
                                                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>İrsaliye No</Label>
                                        <Input value={formData.waybillNo} onChange={(e) => setFormData({ ...formData, waybillNo: e.target.value })} placeholder="Belge No" />
                                    </div>

                                    {/* TESLİM ALINDI MI? (Sadece Giriş İçin) */}
                                    {formData.type === 'INBOUND' && (
                                        <div className="md:col-span-3 bg-blue-50 p-2 rounded flex items-center gap-2 border border-blue-100">
                                            <Switch checked={formData.isReceived} onCheckedChange={c => setFormData({ ...formData, isReceived: c })} />
                                            <div className="text-sm">
                                                <span className="font-bold text-slate-800">{formData.isReceived ? 'TESLİM ALINDI' : 'BEKLEYEN SİPARİŞ'}</span>
                                                <p className="text-xs text-slate-500">{formData.isReceived ? 'Stoklar hemen güncellenecek.' : 'Yönetici onayı bekleyecek.'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. ÜRÜN EKLEME ALANI */}
                                <div className="flex flex-col md:flex-row gap-2 items-end bg-white p-3 border rounded-lg shadow-sm">
                                    <div className="w-full md:flex-1 space-y-1">
                                        <Label className="text-xs">Ürün</Label>
                                        <Select value={tempItem.productId} onValueChange={(val) => {
                                            const p = products.find(x => x.id === val);
                                            setTempItem({ ...tempItem, productId: val, productName: p.name, stock: p.currentStock, sku: p.sku });
                                        }}>
                                            <SelectTrigger><SelectValue placeholder="Ürün Seç..." /></SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} <span className="text-xs text-slate-400">({p.sku}) | Stok: {p.currentStock}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Label className="text-xs">Miktar</Label>
                                        <Input type="number" min="1" value={tempItem.quantity} onChange={(e) => setTempItem({ ...tempItem, quantity: Number(e.target.value) })} />
                                    </div>
                                    <div className="w-32 space-y-1">
                                        <Label className="text-xs">Birim</Label>
                                        <Select value={tempItem.unit} onValueChange={(val) => setTempItem({ ...tempItem, unit: val })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PIECE">Adet</SelectItem>
                                                <SelectItem value="BOX">Koli</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={addItem} className="bg-slate-900 text-white"><Plus size={18} /></Button>
                                </div>

                                {/* 3. EKLENENLER LİSTESİ */}
                                <div className="border rounded-lg overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Ürün Adı</TableHead>
                                                <TableHead>Kod</TableHead>
                                                <TableHead>Miktar</TableHead>
                                                <TableHead className="text-right">Sil</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {formData.items.length === 0 ? (
                                                <TableRow><TableCell colSpan={4} className="text-center h-20 text-slate-400">Henüz ürün eklenmedi.</TableCell></TableRow>
                                            ) : (
                                                formData.items.map((item, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                                        <TableCell className="text-xs font-mono text-slate-500">{item.productSku}</TableCell>
                                                        <TableCell><Badge variant="secondary">{item.quantity} {item.unit === 'BOX' ? 'Koli' : 'Adet'}</Badge></TableCell>
                                                        <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="text-red-500 hover:bg-red-50"><Trash2 size={14} /></Button></TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                                    <Button type="submit" className="bg-green-600 hover:bg-green-700 w-32" onClick={handleSave} disabled={saving}>
                                        {saving ? <CustomLoader size="sm" className="mr-2" /> : 'Kaydet'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isScannerOpen && <BarcodeScanner onScanSuccess={onBarcodeScanned} onClose={() => setIsScannerOpen(false)} />}

            {/* LİSTELEME */}
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
                            transactions.map((tx) => (
                                <TableRow key={tx.id} className={`hover:bg-slate-50/50 transition-colors ${tx.status === 'PENDING' ? 'bg-yellow-50/40' : ''}`}>
                                    <TableCell className="text-xs text-slate-500 font-mono">
                                        {new Date(tx.createdAt).toLocaleDateString('tr-TR')}
                                        <span className="text-slate-400 ml-1">{new Date(tx.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={tx.type === 'INBOUND' ? 'default' : 'destructive'} className={`gap-1 px-2 py-0.5 font-normal ${tx.type === 'INBOUND' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : (tx.type === 'WASTAGE' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200')}`}>
                                                {tx.type === 'INBOUND' ? <ArrowDownRight size={12} /> : (tx.type === 'WASTAGE' ? <AlertTriangle size={12} /> : <ArrowUpRight size={12} />)}
                                                {tx.type === 'INBOUND' ? 'GİRİŞ' : (tx.type === 'WASTAGE' ? 'ZAYİ' : 'ÇIKIŞ')}
                                            </Badge>
                                            {tx.status === 'PENDING' && <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">ONAY BEKLİYOR</Badge>}
                                        </div>
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