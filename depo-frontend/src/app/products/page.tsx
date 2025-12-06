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
import { Plus, Search, Loader2, Trash2, Lock, Check, X, FileText, User, Filter, AlertTriangle, ShoppingCart, ScanBarcode, Edit2, PackageX, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import BarcodeScanner from '@/components/BarcodeScanner';
import EmptyState from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomLoader } from '@/components/ui/custom-loader';

export default function ProductsPage() {
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [userRole, setUserRole] = useState<string>('VIEWER');

    // Fetch all data using custom hook
    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'products', url: '/products' },
        { key: 'warehouses', url: '/settings/warehouses' },
        { key: 'departments', url: '/settings/departments' },
        { key: 'suppliers', url: '/suppliers' }
    ]);

    const products = data.products || [];
    const warehouses = data.warehouses || [];
    const departments = data.departments || [];
    const allSuppliers = data.suppliers || [];

    const [showCritical, setShowCritical] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Düzenleme Modu
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    // Hızlı Ekleme
    const [quickOpen, setQuickOpen] = useState(false);
    const [quickType, setQuickType] = useState<'WAREHOUSE' | 'DEPARTMENT' | 'SUPPLIER'>('WAREHOUSE');
    const [quickName, setQuickName] = useState('');

    const [formData, setFormData] = useState({
        name: '', barcode: '', minStock: 10, warehouseId: '', departmentId: '', supplierId: '',
        buyingPrice: 0, sellingPrice: 0, isCash: true, paymentDate: '', currentStock: 0,
        unitType: 'PIECE', itemsPerBox: 1, batchNumber: '', expirationDate: '',
        file: null as File | null
    });

    // Seçili Tedarikçiler Listesi (Form İçi)
    const [selectedSuppliers, setSelectedSuppliers] = useState<{ id: string, name: string, isMain: boolean }[]>([]);
    const [newSupplierName, setNewSupplierName] = useState('');

    const [requestForm, setRequestForm] = useState({ productId: '', quantity: 10, reason: '' });
    const [requestOpen, setRequestOpen] = useState(false);

    useEffect(() => {
        const localUser = localStorage.getItem('user');
        if (localUser) setUserRole(JSON.parse(localUser).role || 'VIEWER');
    }, []);

    useEffect(() => {
        let result = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search)));
        if (showCritical) result = result.filter(p => p.currentStock <= p.minStock);
        if (selectedWarehouse !== 'ALL') result = result.filter(p => p.warehouseId === selectedWarehouse);
        setFilteredProducts(result);
    }, [products, search, showCritical, selectedWarehouse]);

    // --- DÜZENLEME MODU ---
    const openEdit = (product: any) => {
        setIsEditMode(true); setSelectedProductId(product.id);
        setFormData({
            name: product.name, barcode: product.barcode || '', minStock: product.minStock,
            warehouseId: product.warehouseId || '', departmentId: product.departmentId || '',
            supplierId: product.supplierId || '', buyingPrice: product.buyingPrice, sellingPrice: product.sellingPrice,
            isCash: product.isCash, paymentDate: product.paymentDate ? new Date(product.paymentDate).toISOString().split('T')[0] : '',
            currentStock: product.currentStock, unitType: product.unitType, itemsPerBox: product.itemsPerBox,
            batchNumber: product.batchNumber || '', expirationDate: product.expirationDate ? new Date(product.expirationDate).toISOString().split('T')[0] : '',
            file: null
        });

        // Tedarikçileri Doldur
        if (product.suppliers && product.suppliers.length > 0) {
            const formatted = product.suppliers.map((s: any) => ({ id: s.supplier.id, name: s.supplier.name, isMain: s.isMain }));
            setSelectedSuppliers(formatted);
        } else { setSelectedSuppliers([]); }
        setOpen(true);
    };

    const openCreate = () => {
        setIsEditMode(false); setSelectedProductId(null);
        setFormData({ name: '', barcode: '', minStock: 10, warehouseId: '', departmentId: '', supplierId: '', buyingPrice: 0, sellingPrice: 0, isCash: true, paymentDate: '', currentStock: 0, unitType: 'PIECE', itemsPerBox: 1, batchNumber: '', expirationDate: '', file: null });
        setSelectedSuppliers([]); setOpen(true);
    };

    // --- TEDARİKÇİ YÖNETİMİ ---
    const addSupplierToList = (id: string) => {
        const s = allSuppliers.find(sup => sup.id === id);
        if (s && !selectedSuppliers.find(sel => sel.id === id)) {
            const isFirst = selectedSuppliers.length === 0;
            setSelectedSuppliers([...selectedSuppliers, { id: s.id, name: s.name, isMain: isFirst }]);
            if (isFirst) setFormData(prev => ({ ...prev, supplierId: s.id }));
        }
    };

    const addNewSupplierToList = () => {
        if (!newSupplierName) return;
        api.post('/suppliers', { name: newSupplierName }).then(res => {
            setAllSuppliers([...allSuppliers, res.data]);
            const isFirst = selectedSuppliers.length === 0;
            setSelectedSuppliers([...selectedSuppliers, { id: res.data.id, name: res.data.name, isMain: isFirst }]);
            setNewSupplierName('');
            if (isFirst) setFormData(prev => ({ ...prev, supplierId: res.data.id }));
            toast.success("Tedarikçi eklendi.");
        });
    };

    const setMainSupplier = (id: string) => {
        setSelectedSuppliers(selectedSuppliers.map(s => ({ ...s, isMain: s.id === id })));
        setFormData(prev => ({ ...prev, supplierId: id }));
    };

    const removeSupplier = (id: string) => {
        const newList = selectedSuppliers.filter(s => s.id !== id);
        setSelectedSuppliers(newList);
        if (formData.supplierId === id && newList.length > 0) setFormData(prev => ({ ...prev, supplierId: newList[0].id }));
        else if (newList.length === 0) setFormData(prev => ({ ...prev, supplierId: '' }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);

        // Tedarikçi Kontrolü
        if (selectedSuppliers.length === 0 && !formData.supplierId) {
            toast.warning("En az bir tedarikçi seçmelisiniz.");
            setSaving(false);
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => { if (key !== 'file') data.append(key, (formData as any)[key]) });
        if (formData.file) data.append('file', formData.file);
        data.append('suppliers', JSON.stringify(selectedSuppliers));

        try {
            if (isEditMode && selectedProductId) { await api.patch(`/products/${selectedProductId}`, data); toast.success('Güncellendi.'); }
            else { await api.post('/products', data); toast.success('Kaydedildi.'); }
            setOpen(false); fetchData();
        }
        catch (e) { toast.error('Hata.'); } finally { setSaving(false); }
    };

    const handleRequestCreate = async () => {
        try { await api.post('/requests', requestForm); setRequestOpen(false); toast.success("Talep gönderildi."); } catch (e) { toast.error("Hata."); }
    }

    const canManage = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
    const canCreate = ['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(userRole);

    const onBarcodeScanned = (code: string) => { setIsScannerOpen(false); const p = products.find(x => x.barcode === code); if (p) toast.info(`Kayıtlı: ${p.name}`); else if (confirm('Bulunamadı. Ekleyelim mi?')) { openCreate(); setFormData(prev => ({ ...prev, barcode: code })); } };

    const handleQuickCreate = async () => {
        if (!quickName) return;
        try {
            if (quickType === 'SUPPLIER') {
                const res = await api.post('/suppliers', { name: quickName });
                setAllSuppliers([...allSuppliers, res.data]); addSupplierToList(res.data.id);
            } else {
                const endpoint = quickType === 'WAREHOUSE' ? '/settings/warehouses' : '/settings/departments';
                const res = await api.post(endpoint, { name: quickName });
                if (quickType === 'WAREHOUSE') { setWarehouses([...warehouses, res.data]); setFormData(prev => ({ ...prev, warehouseId: res.data.id })); }
                else { setDepartments([...departments, res.data]); setFormData(prev => ({ ...prev, departmentId: res.data.id })); }
            }
            setQuickOpen(false); setQuickName(''); toast.success("Eklendi.");
        } catch (e) { toast.error("Hata."); }
    };
    const openQuickDialog = (type: any) => { setQuickType(type); setQuickOpen(true); };

    const handleDelete = async (id: string) => { if (!confirm('Silinsin mi?')) return; try { await api.delete(`/products/${id}`); setProducts(products.filter(p => p.id !== id)); toast.success("Silindi."); } catch (e) { toast.error('Hata.'); } };
    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => { let reason = ''; if (status === 'REJECTED') { const input = prompt("Neden?"); if (!input) return; reason = input; } try { await api.patch(`/products/${id}/status`, { status, reason }); fetchData(); toast.success("Güncellendi."); } catch (e) { toast.error("Hata."); } };

    return (
        <AppLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div><h1 className="text-2xl font-bold text-slate-900">Ürün Yönetimi</h1></div>
                <div className="flex gap-2 flex-wrap items-center">
                    <div className={`flex items-center space-x-2 border px-3 py-2 rounded-md transition-colors ${showCritical ? 'bg-red-50 border-red-200' : 'bg-white/70 backdrop-blur'}`}><Switch id="critical" checked={showCritical} onCheckedChange={setShowCritical} /><Label htmlFor="critical" className={`font-bold cursor-pointer flex items-center gap-1 ${showCritical ? 'text-red-600' : 'text-slate-600'}`}><AlertTriangle size={14} /> Kritik Stok</Label></div>
                    <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}><SelectTrigger className="w-[160px] bg-white/70 backdrop-blur"><SelectValue placeholder="Depo Filtre" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tüm Depolar</SelectItem>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>
                    <Button variant="outline" onClick={() => setIsScannerOpen(true)}><ScanBarcode className="mr-2 h-4 w-4" /> Tara</Button>
                    {canCreate && <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Yeni Ürün</Button>}
                </div>
            </div>

            {isScannerOpen && <BarcodeScanner onScanSuccess={onBarcodeScanned} onClose={() => setIsScannerOpen(false)} />}

            <div className="bg-white/80 backdrop-blur-lg rounded-md border border-slate-200 shadow-sm">
                <Table>
                    <TableHeader><TableRow><TableHead>SKU/Barkod</TableHead><TableHead>Ürün</TableHead><TableHead>Tedarikçi</TableHead><TableHead>Konum</TableHead><TableHead>Birim</TableHead><TableHead>Stok</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredProducts.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="p-0 border-none"><EmptyState icon={PackageX} title="Ürün Bulunamadı" description={search ? "Arama kriterlerine uygun ürün yok." : "Henüz ürün eklenmemiş."} actionLabel={canCreate && !search ? "+ Ekle" : undefined} onAction={canCreate && !search ? openCreate : undefined} /></TableCell></TableRow>
                        ) : (
                            filteredProducts.map((p) => (
                                <TableRow key={p.id} className={`${p.status === 'PENDING' ? 'bg-yellow-50/50' : ''} ${p.currentStock <= p.minStock && p.status === 'APPROVED' ? 'bg-red-50/40' : ''}`}>
                                    <TableCell className="font-mono text-xs"><div>{p.sku}</div><div className="text-slate-400">{p.barcode}</div></TableCell>
                                    <TableCell><div className="font-medium">{p.name}</div>{p.documentUrl && <a href={`http://localhost:3000/uploads/${p.documentUrl}`} target="_blank" className="text-[10px] text-blue-600 flex items-center gap-1 hover:underline"><FileText size={10} /> Belge</a>}</TableCell>
                                    <TableCell className="text-sm text-slate-600">
                                        {p.suppliers?.find((s: any) => s.isMain)?.supplier.name || (p.suppliers?.[0]?.supplier.name) || '-'}
                                        {p.suppliers?.length > 1 && <span className="text-xs text-slate-400 ml-1">(+{p.suppliers.length - 1})</span>}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500"><div>{p.warehouse?.name || '-'}</div><div className="text-slate-400">{p.department?.name}</div></TableCell>
                                    <TableCell><Badge variant="outline" className="bg-slate-50">{p.unitType === 'BOX' ? `Koli (${p.itemsPerBox})` : 'Adet'}</Badge></TableCell>
                                    <TableCell><span className={`font-bold ${p.currentStock <= p.minStock ? 'text-red-600' : ''}`}>{p.currentStock}</span></TableCell>
                                    <TableCell>{p.status === 'APPROVED' ? <Badge className="bg-green-100 text-green-700 border-green-200">Onaylı</Badge> : <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Bekliyor</Badge>}</TableCell>
                                    <TableCell className="text-right"><div className="flex justify-end gap-2">
                                        {p.currentStock <= p.minStock && p.status === 'APPROVED' && (<Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { setRequestForm({ ...requestForm, productId: p.id, quantity: 10, reason: 'Kritik Stok' }); setRequestOpen(true); }} title="Talep Et"><ShoppingCart size={14} /></Button>)}
                                        {canManage && (<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => openEdit(p)}><Edit2 className="h-4 w-4 text-slate-600" /></Button>)}
                                        {canManage && p.status === 'PENDING' && (<><Button size="icon" className="h-8 w-8 bg-green-100 text-green-700" onClick={() => handleStatusUpdate(p.id, 'APPROVED')}><Check className="h-4 w-4" /></Button><Button size="icon" className="h-8 w-8 bg-red-100 text-red-700" onClick={() => handleStatusUpdate(p.id, 'REJECTED')}><X className="h-4 w-4" /></Button></>)}
                                        {canManage && (<Button variant="ghost" size="icon" className="hover:text-red-600" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>)}
                                    </div></TableCell>
                                </TableRow>
                            )))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{isEditMode ? 'Ürünü Düzenle' : 'Yeni Ürün'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Ad</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div><div className="space-y-2"><Label>Barkod</Label><Input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} /></div></div>

                        <div className="bg-slate-50 p-3 rounded border border-blue-100 space-y-3">
                            <Label className="text-blue-800 font-medium flex items-center gap-2"><Truck size={16} /> Tedarikçi Yönetimi</Label>
                            <div className="flex gap-2">
                                <Select onValueChange={addSupplierToList}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Listeden Ekle" /></SelectTrigger>
                                    <SelectContent>{allSuppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <div className="flex items-center gap-1">
                                    <Input placeholder="Yeni Tedarikçi..." className="bg-white" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
                                    <Button type="button" size="sm" variant="secondary" onClick={addNewSupplierToList}><Plus size={16} /></Button>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedSuppliers.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                        <div className="flex items-center gap-2">
                                            <div onClick={() => setMainSupplier(s.id)} className={`cursor-pointer w-5 h-5 rounded-full border flex items-center justify-center ${s.isMain ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-transparent hover:border-blue-400'}`} title="Ana Tedarikçi Yap">{s.isMain && <Check size={12} />}</div>
                                            <span className={s.isMain ? 'font-bold text-blue-700' : ''}>{s.name}</span>
                                            {s.isMain && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">ANA</span>}
                                        </div>
                                        <X size={14} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeSupplier(s.id)} />
                                    </div>
                                ))}
                                {selectedSuppliers.length === 0 && <div className="text-xs text-slate-400 italic text-center py-2">Henüz tedarikçi seçilmedi.</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-blue-100">
                            <div className="space-y-2"><Label>Birim Tipi</Label><Select onValueChange={(val) => setFormData({ ...formData, unitType: val })} value={formData.unitType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PIECE">Adet (Tekil)</SelectItem><SelectItem value="BOX">Koli / Kutu</SelectItem></SelectContent></Select></div>
                            {formData.unitType === 'BOX' && (<div className="space-y-2 animate-in fade-in"><Label>Koli İçi Adet</Label><Input type="number" min="1" value={formData.itemsPerBox} onChange={e => setFormData({ ...formData, itemsPerBox: Number(e.target.value) })} /></div>)}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Depo *</Label><Select value={formData.warehouseId} onValueChange={(val) => { if (val === 'NEW') openQuickDialog('WAREHOUSE'); else setFormData({ ...formData, warehouseId: val }) }}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}<SelectItem value="NEW" className="text-blue-600 border-t">+ Yeni Depo</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Departman *</Label><Select value={formData.departmentId} onValueChange={(val) => { if (val === 'NEW') openQuickDialog('DEPARTMENT'); else setFormData({ ...formData, departmentId: val }) }}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}<SelectItem value="NEW" className="text-blue-600 border-t">+ Yeni Departman</SelectItem></SelectContent></Select></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border"><div className="space-y-2"><Label>Geliş (₺)</Label><Input type="number" required min="0" value={formData.buyingPrice} onChange={(e) => setFormData({ ...formData, buyingPrice: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Satış (₺)</Label><Input type="number" min="0" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} /></div></div>

                        <div className="grid grid-cols-2 gap-4 bg-orange-50 p-3 rounded border border-orange-100">
                            <div className="space-y-2"><Label>Parti No</Label><Input placeholder="Lot/Batch" value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Son Kul. Tarihi</Label><Input type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} /></div>
                        </div>

                        <div className="p-3 border rounded bg-slate-50 space-y-3"><div className="flex items-center gap-2"><input type="checkbox" checked={formData.isCash} onChange={(e) => setFormData({ ...formData, isCash: e.target.checked })} className="w-4 h-4" /><Label>Peşin Ödeme</Label></div>{!formData.isCash && (<div className="space-y-2"><Label>Vade Tarihi</Label><Input type="date" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} /></div>)}</div>
                        <div className="space-y-2"><Label>Belge (Opsiyonel)</Label><Input type="file" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })} /></div>
                        <div className="space-y-2 pt-2 border-t"><Label>Min. Stok Uyarısı</Label><Input type="number" min="0" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })} /></div>

                        <Button type="submit" className="w-full bg-slate-900" disabled={saving}>{saving ? <CustomLoader size="sm" className="mr-2" /> : (isEditMode ? 'Güncelle' : 'Kaydet')}</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={quickOpen} onOpenChange={setQuickOpen}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Hızlı Ekle</DialogTitle></DialogHeader><div className="space-y-4 mt-2"><Input placeholder="İsim giriniz" value={quickName} onChange={e => setQuickName(e.target.value)} /><Button onClick={handleQuickCreate} className="w-full bg-blue-600">Ekle</Button></div></DialogContent></Dialog>

            <Dialog open={requestOpen} onOpenChange={setRequestOpen}><DialogContent><DialogHeader><DialogTitle>Satın Alma Talebi</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Miktar</Label><Input type="number" value={requestForm.quantity} onChange={e => setRequestForm({ ...requestForm, quantity: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Sebep</Label><Input value={requestForm.reason} onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })} /></div><Button onClick={handleRequestCreate} className="w-full bg-slate-900">Gönder</Button></div></DialogContent></Dialog>
        </AppLayout>
    );
}