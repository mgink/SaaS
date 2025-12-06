'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useMultipleDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Warehouse, Plus, Package, MapPin, Trash2, ArrowRightLeft,
    AlertCircle, X, Layers, Edit2, GitBranch, Wallet, AlertTriangle,
    PackageOpen, CheckCircle2, ShoppingCart, Truck, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';
import { CustomLoader } from '@/components/ui/custom-loader';
import { Checkbox } from "@/components/ui/checkbox";

export default function WarehousesPage() {
    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'warehouses', url: '/settings/warehouses' },
        { key: 'branches', url: '/branches' },
        { key: 'suppliers', url: '/suppliers' }
    ]);

    const warehouses = data.warehouses || [];
    const branches = data.branches || [];
    const suppliers = data.suppliers || [];

    // Modallar
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

    // Detay Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [warehouseDetails, setWarehouseDetails] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Toplu Sipariş State'leri (YENİ)
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkItems, setBulkItems] = useState<Record<string, { isSelected: boolean, quantity: number, supplierId: string }>>({});
    const [bulkLoading, setBulkLoading] = useState(false);

    // Formlar
    const [form, setForm] = useState({ name: '', location: '', branchId: '', departments: [] as string[] });
    const [tempDept, setTempDept] = useState('');

    // Transfer State
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');

    const fetchData = async () => {
        try {
            const [wRes, bRes, sRes] = await Promise.all([
                api.get('/settings/warehouses'),
                api.get('/branches'),
                api.get('/suppliers') // Tedarikçileri de çek
            ]);
            setWarehouses(wRes.data);
            setBranches(bRes.data);
            setSuppliers(sRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Veriler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- DEPO DETAYLARINI GÖRÜNTÜLE ---
    const openDetails = async (warehouseId: string) => {
        setIsDetailOpen(true);
        setDetailLoading(true);
        setIsBulkMode(false); // Modu sıfırla
        try {
            const res = await api.get(`/settings/warehouses/${warehouseId}/details`);
            setWarehouseDetails(res.data);
        } catch (e) {
            toast.error("Detaylar alınamadı.");
            setIsDetailOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    // --- TOPLU SİPARİŞ MODU ---
    const startBulkMode = () => {
        if (!warehouseDetails?.criticalList) return;

        const initialBulk: any = {};
        warehouseDetails.criticalList.forEach((p: any) => {
            // Tedarikçi isminden ID'yi bulmaya çalış (Backend sadece isim dönüyorsa)
            // Not: İdealde backend'in criticalList içinde supplierId de dönmesi gerekir.
            // Eşleşme olmazsa boş bırakır, kullanıcı seçer.
            const matchedSupplier = suppliers.find(s => s.name === p.supplier);

            // Önerilen miktar: Min Stok - Mevcut Stok + %20 Tampon (En az 5)
            const suggestedQty = Math.max(5, (p.min - p.stock) + Math.ceil(p.min * 0.2));

            initialBulk[p.id] = {
                isSelected: true,
                quantity: suggestedQty,
                supplierId: matchedSupplier ? matchedSupplier.id : ''
            };
        });

        setBulkItems(initialBulk);
        setIsBulkMode(true);
    };

    const handleBulkSubmit = async () => {
        const itemsToOrder = Object.entries(bulkItems)
            .filter(([_, val]) => val.isSelected && val.quantity > 0)
            .map(([productId, val]) => ({
                productId,
                quantity: val.quantity,
                // Eğer tedarikçi seçilmediyse hata vermemesi için kontrol gerekebilir
                // Şimdilik boşsa backend'in varsayılanı kullanmasını umabiliriz veya zorlayabiliriz.
                // Biz burada basit bir loop ile istek atacağız.
            }));

        if (itemsToOrder.length === 0) {
            toast.warning("Sipariş verilecek ürün seçilmedi.");
            return;
        }

        setBulkLoading(true);
        try {
            // Promise.all ile paralel istek (Backend'de toplu endpoint yoksa)
            const promises = itemsToOrder.map(item => {
                const supplierId = bulkItems[item.productId].supplierId;
                // Talep oluşturma endpointine istek at
                return api.post('/requests', {
                    productId: item.productId,
                    quantity: item.quantity,
                    reason: 'Kritik Stok - Toplu Sipariş',
                    type: 'PURCHASE',
                    // Eğer backend supplierId kabul etmiyorsa (otomatik buluyorsa) göndermeyebiliriz
                    // Ancak talep oluştururken supplierId genellikle gerekmez, sipariş aşamasında gerekir.
                    // Burada "Talep" oluşturuyoruz.
                });
            });

            await Promise.all(promises);
            toast.success(`${itemsToOrder.length} adet talep oluşturuldu.`);
            setIsBulkMode(false);
            setIsDetailOpen(false);
        } catch (e) {
            toast.error("Bazı talepler oluşturulamadı.");
        } finally {
            setBulkLoading(false);
        }
    };

    // --- FORM İŞLEMLERİ ---
    const addTempDept = () => {
        if (tempDept.trim()) {
            setForm({ ...form, departments: [...form.departments, tempDept.trim()] });
            setTempDept('');
        }
    };

    const removeTempDept = (i: number) => {
        setForm({ ...form, departments: form.departments.filter((_, idx) => idx !== i) });
    };

    const handleCreate = async () => {
        if (!form.name) return;
        try {
            await api.post('/settings/warehouses', form);
            setForm({ name: '', location: '', branchId: '', departments: [] });
            setIsCreateOpen(false);
            fetchData();
            toast.success("Depo oluşturuldu.");
        } catch (e) {
            toast.error("Hata oluştu.");
        }
    };

    const handleUpdate = async () => {
        if (!form.name || !selectedWarehouse) return;
        try {
            await api.patch(`/settings/warehouses/${selectedWarehouse.id}`, {
                name: form.name,
                location: form.location,
                branchId: form.branchId
            });
            setIsEditOpen(false);
            fetchData();
            toast.success("Güncellendi.");
        } catch (e) {
            toast.error("Hata oluştu.");
        }
    };

    const openEdit = (e: any, w: any) => {
        e.stopPropagation();
        setSelectedWarehouse(w);
        setForm({ name: w.name, location: w.location || '', branchId: w.branchId || '', departments: [] });
        setIsEditOpen(true);
    }

    const handleDelete = async (e: any, id: string) => {
        e.stopPropagation();
        if (!confirm('Silinsin mi?')) return;
        try {
            await api.delete(`/settings/warehouses/${id}`);
            fetchData();
            toast.success("Silindi.");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Hata.");
        }
    }

    const handleTransfer = async () => {
        try {
            await api.post('/settings/warehouses/transfer', { fromId: transferFrom, toId: transferTo });
            setIsTransferOpen(false);
            fetchData();
            toast.success("Taşındı.");
        } catch (e) {
            toast.error("Hata oluştu.");
        }
    }

    if (loading) return <AppLayout><div className="flex h-screen items-center justify-center"><CustomLoader size="xl" /></div></AppLayout>;

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-slate-900">Depo Yönetimi</h1><p className="text-sm text-slate-500">Lokasyon ve stok analizi.</p></div>
                <div className="flex gap-2">
                    <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                        <DialogTrigger asChild><Button variant="outline"><ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Transfer</DialogTitle></DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 flex gap-2 text-sm text-yellow-700"><AlertCircle size={16} /><p>Tüm ürünler aktarılacak.</p></div>
                                <div className="space-y-2"><Label>Kaynak</Label><Select onValueChange={setTransferFrom}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name} ({w._count.products} Ürün)</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Hedef</Label><Select onValueChange={setTransferTo}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
                                <Button onClick={handleTransfer} className="w-full bg-slate-900">Başlat</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Yeni Depo</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader><DialogTitle>Yeni Depo</DialogTitle></DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2"><Label>Ad</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Konum</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Şube</Label><Select onValueChange={(val) => setForm({ ...form, branchId: val })}><SelectTrigger><SelectValue placeholder="Seç (Opsiyonel)" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2">
                                    <Label>Departmanlar</Label>
                                    <div className="flex gap-2"><Input placeholder="Raf A..." value={tempDept} onChange={e => setTempDept(e.target.value)} /><Button variant="secondary" onClick={addTempDept} type="button"><Plus size={16} /></Button></div>
                                    <div className="flex flex-wrap gap-2 mt-2">{form.departments.map((d, i) => (<Badge key={i} variant="secondary" className="gap-1">{d}<X size={12} className="cursor-pointer" onClick={() => removeTempDept(i)} /></Badge>))}</div>
                                </div>
                                <Button onClick={handleCreate} className="w-full bg-slate-900">Oluştur</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {warehouses.length === 0 ? (
                <EmptyState icon={Warehouse} title="Depo Bulunamadı" description="Henüz hiç depo tanımlanmamış. İlk deponuzu oluşturarak başlayın." actionLabel="+ İlk Depoyu Ekle" onAction={() => setIsCreateOpen(true)} />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {warehouses.map((w) => (
                        <Card key={w.id} onClick={() => openDetails(w.id)} className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 group relative cursor-pointer hover:scale-[1.02]">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white shadow-sm" onClick={(e) => openEdit(e, w)}><Edit2 size={16} /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 bg-white shadow-sm" onClick={(e) => handleDelete(e, w.id)}><Trash2 size={16} /></Button>
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-lg font-bold flex items-center gap-2"><Warehouse className="text-slate-400" size={20} /> {w.name}</CardTitle></CardHeader>
                            <CardContent>
                                {w.branch && <div className="mb-3"><Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1"><GitBranch size={12} /> {w.branch.name}</Badge></div>}
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"><Package size={16} />{w._count?.products || 0} Ürün</div>
                                    <p className="text-xs text-blue-500 font-medium">Detaylar &rarr;</p>
                                </div>
                                {w.departments && w.departments.length > 0 && (<div className="flex flex-wrap gap-1 mt-3">{w.departments.map((d: any) => (<span key={d.id} className="text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded text-slate-600 flex items-center gap-1"><Layers size={10} /> {d.name}</span>))}</div>)}
                                <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-slate-400"><div className="flex items-center gap-1"><MapPin size={12} /> {w.location || 'Merkez'}</div></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>Depoyu Düzenle</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2"><Label>Depo Adı</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Konum</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Bağlı Şube</Label><Select value={form.branchId} onValueChange={(val) => setForm({ ...form, branchId: val })}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
                        <Button onClick={handleUpdate} className="w-full bg-slate-900">Güncelle</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- DETAY MODALI --- */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-4xl bg-slate-50 max-h-[90vh] overflow-y-auto">
                    {detailLoading ? <div className="h-64 flex items-center justify-center"><CustomLoader /></div> : warehouseDetails && (
                        <>
                            <DialogHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <DialogTitle className="text-2xl flex items-center gap-2"><Warehouse className="text-blue-600" /> {warehouseDetails.info.name}</DialogTitle>
                                        <div className="text-sm text-slate-500 flex gap-2 mt-1">
                                            <span className="flex items-center gap-1"><MapPin size={14} /> {warehouseDetails.info.location || 'Konum Yok'}</span>
                                            {warehouseDetails.info.branch && <span className="flex items-center gap-1"><GitBranch size={14} /> {warehouseDetails.info.branch.name}</span>}
                                        </div>
                                    </div>
                                    {/* TOPLU SİPARİŞ BUTONU */}
                                    {warehouseDetails.criticalList.length > 0 && (
                                        <Button
                                            variant={isBulkMode ? "secondary" : "default"}
                                            className={isBulkMode ? "bg-slate-200 text-slate-800" : "bg-red-600 hover:bg-red-700 text-white"}
                                            onClick={isBulkMode ? () => setIsBulkMode(false) : startBulkMode}
                                        >
                                            {isBulkMode ? <><X size={16} className="mr-2" /> İptal Et</> : <><ShoppingCart size={16} className="mr-2" /> Eksikleri Sipariş Et</>}
                                        </Button>
                                    )}
                                </div>
                            </DialogHeader>

                            {!isBulkMode && (
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                                        <div className="text-xs text-slate-500 uppercase font-bold">Toplam Stok</div>
                                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Package className="text-blue-500" size={20} /> {warehouseDetails.stats.totalStock}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                                        <div className="text-xs text-slate-500 uppercase font-bold">Depo Değeri</div>
                                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Wallet className="text-green-500" size={20} /> {warehouseDetails.stats.totalValue.toLocaleString()} ₺</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-red-500">
                                        <div className="text-xs text-red-600 uppercase font-bold">Kritik / Eksik</div>
                                        <div className="text-2xl font-bold text-red-700 flex items-center gap-2"><AlertTriangle size={20} /> {warehouseDetails.stats.criticalCount + warehouseDetails.stats.outOfStockCount}</div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 bg-white rounded-xl border shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-100 border-b font-bold text-sm text-slate-700 flex justify-between items-center">
                                    <span className="flex items-center gap-2">
                                        {isBulkMode ? <ShoppingCart className="text-red-600" size={18} /> : <AlertTriangle className="text-orange-500" size={18} />}
                                        {isBulkMode ? "Toplu Sipariş Oluştur" : "Kritik & Tükenen Ürünler"}
                                    </span>
                                    <Badge variant="outline">{warehouseDetails.criticalList.length} Kayıt</Badge>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {isBulkMode && <TableHead className="w-[50px]">Seç</TableHead>}
                                                <TableHead>Ürün</TableHead>
                                                <TableHead>Mevcut</TableHead>
                                                <TableHead>Min</TableHead>
                                                {isBulkMode ? (
                                                    <>
                                                        <TableHead>Sipariş Adedi</TableHead>
                                                        <TableHead>Tedarikçi</TableHead>
                                                    </>
                                                ) : (
                                                    <TableHead>Tedarikçi</TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {warehouseDetails.criticalList.length === 0 ? (
                                                <TableRow><TableCell colSpan={isBulkMode ? 6 : 5} className="text-center py-8 text-green-600 font-medium"><CheckCircle2 size={20} className="inline mr-2" /> Tüm stoklar seviyenin üzerinde.</TableCell></TableRow>
                                            ) : (
                                                warehouseDetails.criticalList.map((p: any) => {
                                                    const itemState = bulkItems[p.id];
                                                    return (
                                                        <TableRow key={p.id} className={isBulkMode && itemState?.isSelected ? "bg-blue-50/50" : "hover:bg-red-50/30"}>
                                                            {isBulkMode && (
                                                                <TableCell>
                                                                    <Checkbox
                                                                        checked={itemState?.isSelected || false}
                                                                        onCheckedChange={(checked) => setBulkItems(prev => ({ ...prev, [p.id]: { ...prev[p.id], isSelected: !!checked } }))}
                                                                    />
                                                                </TableCell>
                                                            )}
                                                            <TableCell className="font-medium">
                                                                {p.name}
                                                                <div className="text-[10px] text-slate-400">{p.sku}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {p.stock === 0 ? <Badge variant="destructive" className="text-[10px]">TÜKENDİ</Badge> : <span className="text-red-600 font-bold">{p.stock}</span>}
                                                            </TableCell>
                                                            <TableCell className="text-slate-500">{p.min}</TableCell>

                                                            {isBulkMode ? (
                                                                <>
                                                                    <TableCell>
                                                                        <Input
                                                                            type="number"
                                                                            className="w-20 h-8 bg-white"
                                                                            value={itemState?.quantity || 0}
                                                                            onChange={e => setBulkItems(prev => ({ ...prev, [p.id]: { ...prev[p.id], quantity: Number(e.target.value) } }))}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Select
                                                                            value={itemState?.supplierId || ''}
                                                                            onValueChange={val => setBulkItems(prev => ({ ...prev, [p.id]: { ...prev[p.id], supplierId: val } }))}
                                                                        >
                                                                            <SelectTrigger className="w-[180px] h-8 bg-white"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </TableCell>
                                                                </>
                                                            ) : (
                                                                <TableCell className="text-xs text-slate-600 flex items-center gap-1">
                                                                    <Truck size={12} /> {p.supplier}
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {isBulkMode && (
                                    <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                                        <div className="flex-1 text-xs text-slate-500 flex items-center">
                                            <AlertCircle size={14} className="mr-1 text-blue-500" />
                                            Seçili ürünler için satın alma talebi oluşturulacaktır.
                                        </div>
                                        <Button variant="outline" onClick={() => setIsBulkMode(false)}>İptal</Button>
                                        <Button onClick={handleBulkSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={bulkLoading}>
                                            {bulkLoading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 size={16}" />}
                                            Talepleri Oluştur
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}