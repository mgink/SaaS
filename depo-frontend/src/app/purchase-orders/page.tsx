'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useMultipleDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Truck, PackageCheck, AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { CustomLoader } from '@/components/ui/custom-loader';

export default function PurchaseOrdersPage() {
    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'orders', url: '/purchase-orders' },
        { key: 'suppliers', url: '/suppliers' },
        { key: 'products', url: '/products' }
    ]);

    const orders = data.orders || [];
    const suppliers = data.suppliers || [];
    const products = (data.products || []).filter((p: any) => p.status === 'APPROVED');

    // Yeni Sipariş State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newOrder, setNewOrder] = useState({ supplierId: '', expectedDate: '', items: [] as any[] });
    const [tempItem, setTempItem] = useState({ productId: '', quantity: 1, unitPrice: 0 });

    // Mal Kabul State
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [receiveData, setReceiveData] = useState<any>({}); // { itemId: { received: 0, notes: '' } }



    // --- SİPARİŞ OLUŞTURMA ---
    const addItemToOrder = () => {
        if (!tempItem.productId) return;
        const product = products.find((p: any) => p.id === tempItem.productId);
        setNewOrder({ ...newOrder, items: [...newOrder.items, { ...tempItem, productName: product.name }] });
        setTempItem({ productId: '', quantity: 1, unitPrice: 0 });
    };

    const handleCreateOrder = async () => {
        if (!newOrder.supplierId || newOrder.items.length === 0) { toast.warning("Tedarikçi ve en az bir ürün seçin."); return; }
        try {
            await api.post('/purchase-orders', newOrder);
            setIsCreateOpen(false);
            setNewOrder({ supplierId: '', expectedDate: '', items: [] });
            refetch();
            toast.success("Sipariş oluşturuldu.");
        } catch (e) { /* Global error handler */ }
    };

    // --- MAL KABUL ---
    const openReceiveModal = (order: any) => {
        setSelectedOrder(order);
        // Formu sıfırla
        const initialData: any = {};
        order.items.forEach((item: any) => {
            // Varsayılan olarak kalan miktarı öner
            initialData[item.id] = { received: item.quantityExpected - item.quantityReceived, notes: '' };
        });
        setReceiveData(initialData);
        setIsReceiveOpen(true);
    };

    const handleReceiveSubmit = async () => {
        if (!selectedOrder) return;

        // Sadece > 0 girişi olanları hazırla
        const itemsToSend = Object.keys(receiveData).map(itemId => ({
            id: itemId,
            received: Number(receiveData[itemId].received),
            notes: receiveData[itemId].notes
        })).filter(i => i.received > 0);

        if (itemsToSend.length === 0) { toast.warning("Lütfen en az bir ürün için miktar girin."); return; }

        try {
            await api.post(`/purchase-orders/${selectedOrder.id}/receive`, { items: itemsToSend });
            setIsReceiveOpen(false);
            refetch();
            toast.success("Mal kabul tamamlandı, stoklar güncellendi.");
        } catch (e) { /* Global error handler */ }
    };

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-slate-900">Satın Alma ve Mal Kabul</h1><p className="text-sm text-slate-500">Tedarikçilere verilen siparişleri yönetin.</p></div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Yeni Sipariş</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader><DialogTitle>Yeni Satın Alma Siparişi</DialogTitle></DialogHeader>
                        <div className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Tedarikçi</Label><Select onValueChange={v => setNewOrder({ ...newOrder, supplierId: v })}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger><SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Beklenen Tarih</Label><Input type="date" onChange={e => setNewOrder({ ...newOrder, expectedDate: e.target.value })} /></div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
                                <Label className="text-xs font-bold text-slate-500">SİPARİŞ KALEMLERİ</Label>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1"><Label className="text-xs">Ürün</Label><Select value={tempItem.productId} onValueChange={v => { const p = products.find((x: any) => x.id === v); setTempItem({ ...tempItem, productId: v, unitPrice: p.buyingPrice }) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="w-20 space-y-1"><Label className="text-xs">Miktar</Label><Input type="number" value={tempItem.quantity} onChange={e => setTempItem({ ...tempItem, quantity: Number(e.target.value) })} /></div>
                                    <div className="w-24 space-y-1"><Label className="text-xs">Birim Fiy.</Label><Input type="number" value={tempItem.unitPrice} onChange={e => setTempItem({ ...tempItem, unitPrice: Number(e.target.value) })} /></div>
                                    <Button onClick={addItemToOrder} variant="secondary"><Plus size={16} /></Button>
                                </div>
                                {/* Eklenenler Listesi */}
                                <div className="space-y-1">
                                    {newOrder.items.map((item, i) => (
                                        <div key={i} className="text-sm flex justify-between border-b pb-1">
                                            <span>{item.quantity} x {item.productName}</span>
                                            <span className="font-bold">{(item.quantity * item.unitPrice).toLocaleString()} ₺</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleCreateOrder} className="w-full bg-slate-900">Siparişi Oluştur</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead>Sipariş No</TableHead><TableHead>Tedarikçi</TableHead><TableHead>Durum</TableHead><TableHead>İlerleme</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {orders.map((order: any) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                                    <TableCell><div className="font-medium">{order.supplier.name}</div><div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div></TableCell>
                                    <TableCell>
                                        <Badge className={
                                            order.status === 'ORDERED' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'PARTIAL' ? 'bg-orange-100 text-orange-700' :
                                                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                        }>{order.status === 'ORDERED' ? 'Bekleniyor' : order.status === 'PARTIAL' ? 'Kısmi Geldi' : order.status === 'COMPLETED' ? 'Tamamlandı' : order.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs space-y-1">
                                            {order.items.map((item: any) => (
                                                <div key={item.id} className="flex justify-between gap-4">
                                                    <span>{item.product.name}</span>
                                                    <span className={item.quantityReceived >= item.quantityExpected ? 'text-green-600 font-bold' : 'text-slate-500'}>
                                                        {item.quantityReceived} / {item.quantityExpected}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openReceiveModal(order)}>
                                                <PackageCheck size={14} className="mr-1" /> Mal Kabul
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* MAL KABUL MODALI */}
            <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Mal Kabul: {selectedOrder?.orderNumber}</DialogTitle></DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4 mt-2">
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100 flex gap-2">
                                <AlertCircle size={16} className="mt-0.5" />
                                <div>Gelen ürünlerin miktarını girin. Eksik veya fazla gelirse not ekleyebilirsiniz. Girilen miktar stoğa eklenecektir.</div>
                            </div>

                            <div className="space-y-4">
                                {selectedOrder.items.map((item: any) => {
                                    const remaining = item.quantityExpected - item.quantityReceived;
                                    if (remaining <= 0) return null; // Tamamlananları gösterme

                                    return (
                                        <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center border-b pb-3">
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-800">{item.product.name}</div>
                                                <div className="text-xs text-slate-500">Beklenen: <span className="text-red-600 font-bold">{remaining}</span> adet daha</div>
                                            </div>
                                            <div className="w-full sm:w-32">
                                                <Label className="text-xs">Gelen Miktar</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-green-50 border-green-200 font-bold"
                                                    value={receiveData[item.id]?.received || 0}
                                                    onChange={e => setReceiveData({ ...receiveData, [item.id]: { ...receiveData[item.id], received: e.target.value } })}
                                                />
                                            </div>
                                            <div className="w-full sm:w-48">
                                                <Label className="text-xs">Not (Hasar/Eksik)</Label>
                                                <Input
                                                    placeholder="Not..."
                                                    value={receiveData[item.id]?.notes || ''}
                                                    onChange={e => setReceiveData({ ...receiveData, [item.id]: { ...receiveData[item.id], notes: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <Button onClick={handleReceiveSubmit} className="w-full bg-green-600 hover:bg-green-700">Teslim Al ve Stoğa İşle</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}