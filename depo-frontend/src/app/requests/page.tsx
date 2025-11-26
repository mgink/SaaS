'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Truck, AlertCircle, PackageCheck, Trash2, ListChecks, ArrowUp, ArrowDown, ChevronsUpDown, Building2, Plus, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomLoader } from '@/components/ui/custom-loader';
import { motion, AnimatePresence } from 'framer-motion';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]); // Ürün listesi için state
    const [userRole, setUserRole] = useState('VIEWER');
    const [loading, setLoading] = useState(true);

    // Çoklu Seçim ve Görünüm State'leri
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Yönetici İşlemleri (Onay/Red)
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [isProcessOpen, setIsProcessOpen] = useState(false);
    const [processData, setProcessData] = useState({ status: '', adminNote: '', deliveryDate: '' });

    // Yeni Talep Oluşturma (Create)
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ productId: '', quantity: 10, reason: '' });
    const [createLoading, setCreateLoading] = useState(false);

    const fetchData = async () => {
        const localUser = localStorage.getItem('user');
        if (localUser) {
            const user = JSON.parse(localUser);
            setUserRole(user.role);
        }

        try {
            // Hem talepleri hem de ürünleri (yeni talep için) çekiyoruz
            const [reqRes, prodRes] = await Promise.all([
                api.get('/requests'),
                api.get('/products')
            ]);
            setRequests(reqRes.data);
            // Sadece onaylı ürünler talep edilebilir
            setProducts(prodRes.data.filter((p: any) => p.status === 'APPROVED'));
            setSelectedIds([]);
        } catch (e) {
            toast.error("Veriler çekilemedi.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(); }, []);

    // --- YENİ TALEP OLUŞTURMA ---
    const handleCreate = async () => {
        if (!createForm.productId) {
            toast.warning("Lütfen bir ürün seçiniz.");
            return;
        }
        setCreateLoading(true);
        try {
            await api.post('/requests', { ...createForm, type: 'PURCHASE' });
            toast.success("Talep başarıyla oluşturuldu.");
            setIsCreateOpen(false);
            setCreateForm({ productId: '', quantity: 10, reason: '' });
            fetchData(); // Listeyi yenile
        } catch (e) {
            toast.error("Talep oluşturulamadı.");
        } finally {
            setCreateLoading(false);
        }
    }

    // Seçilen ürünün detayını bul (Tedarikçiyi göstermek için)
    const selectedProduct = products.find(p => p.id === createForm.productId);

    // --- SIRALAMA FONKSİYONU ---
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedRequests = [...requests].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue: any = '';
        let bValue: any = '';

        if (key === 'product.name') {
            aValue = a.product?.name || '';
            bValue = b.product?.name || '';
        } else if (key === 'product.supplier.name') {
            aValue = a.product?.supplier?.name || '';
            bValue = b.product?.supplier?.name || '';
        } else if (key === 'requester.fullName') {
            aValue = a.requester?.fullName || '';
            bValue = b.requester?.fullName || '';
        } else if (key === 'quantity') {
            aValue = Number(a.quantity);
            bValue = Number(b.quantity);
        } else if (key === 'deliveryDate') {
            aValue = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
            bValue = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
        } else {
            aValue = a[key] || '';
            bValue = b[key] || '';
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ChevronsUpDown size={14} className="ml-1 text-slate-400 opacity-50" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-blue-600" /> : <ArrowDown size={14} className="ml-1 text-blue-600" />;
    };

    // --- SEÇİM FONKSİYONLARI ---
    const toggleSelectAll = () => {
        if (selectedIds.length === requests.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(requests.map(r => r.id));
        }
    }

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    }

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds([]);
    }

    // --- TOPLU İŞLEM ---
    const handleBulkAction = async (status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`${selectedIds.length} adet talebi ${status === 'APPROVED' ? 'ONAYLAMAK' : 'REDDETMEK'} istediğinize emin misiniz?`)) return;
        try {
            await api.post('/requests/bulk-status', { ids: selectedIds, status });
            toast.success("Toplu işlem başarılı.");
            fetchData(); // Listeyi yenile
            setIsSelectionMode(false);
        } catch (e) { toast.error("Hata oluştu."); }
    }

    // --- TEKİL İŞLEMLER ---
    const openProcess = (req: any, status: string) => {
        setSelectedReq(req);
        setProcessData({ ...processData, status, adminNote: '', deliveryDate: '' });
        setIsProcessOpen(true);
    }

    const handleProcess = async () => {
        try {
            await api.patch(`/requests/${selectedReq.id}`, processData);
            setIsProcessOpen(false);
            fetchData(); // Listeyi yenile
            toast.success(`Talep güncellendi: ${processData.status}`);
        } catch (e) { toast.error("Hata oluştu."); }
    }

    const handleReceive = async (id: string) => {
        if (!confirm("Ürünler fiziki olarak depoya ulaştı mı? Stok artırılacak.")) return;
        try {
            await api.post(`/requests/${id}/receive`);
            toast.success("Mal kabul yapıldı, stok güncellendi.");
            fetchData(); // Listeyi yenile
        } catch (e) {
            toast.error("İşlem başarısız.");
        }
    }

    const canApprove = ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'].includes(userRole);

    if (loading) return <AppLayout><div className="h-screen flex items-center justify-center"><CustomLoader size="xl" /></div></AppLayout>;

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Satın Alma Talepleri</h1>
                    <p className="text-sm text-slate-500">Personel ve şube taleplerini yönetin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9">
                                <Plus size={16} className="mr-2" /> Yeni Talep
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Yeni Satın Alma Talebi</DialogTitle></DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label>Ürün Seçin</Label>
                                    <Select
                                        value={createForm.productId}
                                        onValueChange={(v) => setCreateForm({ ...createForm, productId: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Listeden seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} <span className="text-slate-400 text-xs">({p.sku})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* OTOMATİK TEDARİKÇİ GÖSTERİMİ */}
                                    {selectedProduct && (
                                        <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 flex items-center gap-2 mt-1 animate-in fade-in">
                                            <Truck size={14} />
                                            <span>
                                                Ana Tedarikçi: <strong>{selectedProduct.supplier?.name || 'Atanmamış'}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Miktar</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={createForm.quantity}
                                        onChange={e => setCreateForm({ ...createForm, quantity: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Talep Nedeni</Label>
                                    <Input
                                        placeholder="Örn: Stok bitmek üzere, Müşteri siparişi..."
                                        value={createForm.reason}
                                        onChange={e => setCreateForm({ ...createForm, reason: e.target.value })}
                                    />
                                </div>

                                <Button onClick={handleCreate} className="w-full bg-slate-900" disabled={createLoading}>
                                    {createLoading ? <CustomLoader size="sm" className="mr-2" /> : 'Talebi Oluştur'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Badge variant="outline" className="text-base px-3 py-1 h-9">{requests.filter(r => r.status === 'PENDING').length} Bekleyen</Badge>
                    {canApprove && (
                        <Button
                            variant={isSelectionMode ? "secondary" : "outline"}
                            onClick={toggleSelectionMode}
                            className="h-9 text-sm border-slate-300"
                        >
                            {isSelectionMode ? <X size={16} className="mr-2" /> : <ListChecks size={16} className="mr-2" />}
                            {isSelectionMode ? 'İptal' : 'Düzenle'}
                        </Button>
                    )}
                </div>
            </div>

            {/* --- TOPLU İŞLEM BARI (STICKY) --- */}
            <AnimatePresence>
                {selectedIds.length > 0 && canApprove && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700"
                    >
                        <span className="text-sm font-bold bg-slate-700 px-2 py-0.5 rounded-md">{selectedIds.length} Seçildi</span>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8" onClick={() => handleBulkAction('APPROVED')}>
                            <Check size={16} className="mr-1" /> Toplu Onayla
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8" onClick={() => handleBulkAction('REJECTED')}>
                            <X size={16} className="mr-1" /> Toplu Reddet
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full ml-2" onClick={() => setSelectedIds([])}>
                            <X size={18} />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <Card className="shadow-sm border-0 overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                {/* Checkbox Header */}
                                {isSelectionMode && canApprove && (
                                    <TableHead className="w-[50px] text-center">
                                        <Checkbox
                                            checked={selectedIds.length === requests.length && requests.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                )}
                                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product.name')}>
                                    <div className="flex items-center">Ürün <SortIcon columnKey="product.name" /></div>
                                </TableHead>
                                {/* TEDARİKÇİ SÜTUNU */}
                                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product.supplier.name')}>
                                    <div className="flex items-center">Tedarikçi <SortIcon columnKey="product.supplier.name" /></div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('quantity')}>
                                    <div className="flex items-center">Miktar <SortIcon columnKey="quantity" /></div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('requester.fullName')}>
                                    <div className="flex items-center">Talep Eden <SortIcon columnKey="requester.fullName" /></div>
                                </TableHead>
                                <TableHead>Neden</TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center">Durum <SortIcon columnKey="status" /></div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('deliveryDate')}>
                                    <div className="flex items-center">Not / Tarih <SortIcon columnKey="deliveryDate" /></div>
                                </TableHead>
                                <TableHead className="text-right">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="h-32 text-center text-slate-500">Henüz talep oluşturulmamış.</TableCell></TableRow>
                            ) : (
                                sortedRequests.map(r => (
                                    <TableRow key={r.id} className={`transition-colors ${r.status === 'PENDING' ? 'bg-blue-50/20 hover:bg-blue-50/40' : 'hover:bg-slate-50'} ${selectedIds.includes(r.id) ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                                        {isSelectionMode && canApprove && (
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={selectedIds.includes(r.id)}
                                                    onCheckedChange={() => toggleSelect(r.id)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{r.product.name}</div>
                                        </TableCell>
                                        {/* TEDARİKÇİ HÜCRESİ */}
                                        <TableCell>
                                            {r.product.supplier ? (
                                                <div className="text-sm text-slate-600 flex items-center gap-1.5">
                                                    <Building2 size={12} className="text-slate-400" />
                                                    {r.product.supplier.name}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell><Badge variant="secondary">{r.quantity} Adet</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{r.requester.fullName}</span>
                                                {r.branch && <span className="text-[10px] text-slate-400">{r.branch.name}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 max-w-[150px] truncate" title={r.reason}>{r.reason}</TableCell>
                                        <TableCell>
                                            <Badge className={
                                                r.status === 'PENDING' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                                                    r.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700' :
                                                        r.status === 'ORDERED' ? 'bg-purple-600 hover:bg-purple-700' :
                                                            r.status === 'DELIVERED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                            }>
                                                {r.status === 'PENDING' ? 'Bekliyor' : r.status === 'APPROVED' ? 'Onaylandı' : r.status === 'ORDERED' ? 'Sipariş' : r.status === 'DELIVERED' ? 'Tamamlandı' : 'Red'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {r.adminNote && <div className="italic text-slate-600 mb-1">"{r.adminNote}"</div>}
                                            {r.deliveryDate && (
                                                <div className={new Date(r.deliveryDate) < new Date() && r.status !== 'DELIVERED' ? "text-red-600 font-bold flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                                                    <Truck size={10} /> {new Date(r.deliveryDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                {canApprove && r.status === 'PENDING' && (
                                                    <>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => openProcess(r, 'APPROVED')} title="Onayla"><Check size={16} /></Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => openProcess(r, 'REJECTED')} title="Reddet"><X size={16} /></Button>
                                                    </>
                                                )}
                                                {canApprove && r.status === 'APPROVED' && (
                                                    <Button size="sm" variant="outline" className="h-7 text-xs border-purple-200 text-purple-600 hover:bg-purple-50" onClick={() => openProcess(r, 'ORDERED')}><Truck size={12} className="mr-1" /> Sipariş</Button>
                                                )}
                                                {canApprove && r.status === 'ORDERED' && (
                                                    <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleReceive(r.id)}><PackageCheck size={12} className="mr-1" /> Kabul</Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* DURUM GÜNCELLEME MODALI */}
            <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Talep İşlemi</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="space-y-2"><Label>Yönetici Notu (Opsiyonel)</Label><Input value={processData.adminNote} onChange={e => setProcessData({ ...processData, adminNote: e.target.value })} placeholder="Örn: Sipariş geçildi, kargo bekleniyor." /></div>
                        {(processData.status === 'APPROVED' || processData.status === 'ORDERED') && (
                            <div className="space-y-2"><Label>Tahmini Teslim Tarihi</Label><Input type="date" onChange={e => setProcessData({ ...processData, deliveryDate: e.target.value })} /></div>
                        )}
                        <Button onClick={handleProcess} className="w-full bg-slate-900">Kaydet</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}