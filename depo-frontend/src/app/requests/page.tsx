'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Truck, AlertCircle, PackageCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import EmptyState from '@/components/EmptyState'; // Eğer yoksa silebilirsin veya oluşturabilirsin
import { ClipboardList } from 'lucide-react';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [userRole, setUserRole] = useState('VIEWER');
    const [loading, setLoading] = useState(true);

    // Yönetici İşlemleri
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [isProcessOpen, setIsProcessOpen] = useState(false);
    const [processData, setProcessData] = useState({ status: '', adminNote: '', deliveryDate: '' });

    const fetchRequests = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role);
        try {
            const res = await api.get('/requests');
            setRequests(res.data);
        } catch (e) { toast.error("Veriler çekilemedi."); } finally { setLoading(false); }
    }

    useEffect(() => { fetchRequests(); }, []);

    // Onay/Red veya Sipariş Penceresini Aç
    const openProcess = (req: any, status: string) => {
        setSelectedReq(req);
        setProcessData({ ...processData, status, adminNote: '', deliveryDate: '' });
        setIsProcessOpen(true);
    }

    // İşlemi Kaydet
    const handleProcess = async () => {
        try {
            await api.patch(`/requests/${selectedReq.id}`, processData);
            setIsProcessOpen(false);
            fetchRequests();
            toast.success(`Talep güncellendi: ${processData.status}`);
        } catch (e) { toast.error("Hata oluştu."); }
    }

    // Mal Kabul İşlemi (Tek Tıkla)
    const handleReceive = async (id: string) => {
        if (!confirm("Ürünler fiziki olarak depoya ulaştı mı? Stok artırılacak.")) return;
        try {
            await api.post(`/requests/${id}/receive`);
            toast.success("Mal kabul yapıldı, stok güncellendi.");
            fetchRequests();
        } catch (e) {
            toast.error("İşlem başarısız.");
        }
    }

    const canApprove = ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'].includes(userRole);

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Satın Alma Talepleri</h1>
                <Badge variant="outline" className="text-base px-3 py-1">{requests.filter(r => r.status === 'PENDING').length} Bekleyen</Badge>
            </div>

            <Card className="shadow-sm border-0">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ürün</TableHead>
                                <TableHead>Miktar</TableHead>
                                <TableHead>Talep Eden</TableHead>
                                <TableHead>Neden</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Not / Tarih</TableHead>
                                <TableHead className="text-right">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 && !loading ? (
                                <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">Henüz talep oluşturulmamış.</TableCell></TableRow>
                            ) : (
                                requests.map(r => (
                                    <TableRow key={r.id} className={r.status === 'PENDING' ? 'bg-blue-50/30' : ''}>
                                        <TableCell className="font-medium">{r.product.name}</TableCell>
                                        <TableCell><Badge variant="secondary">{r.quantity} Adet</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{r.requester.fullName}</span>
                                                {r.branch && <span className="text-[10px] text-slate-400">{r.branch.name}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 max-w-[150px] truncate" title={r.reason}>{r.reason}</TableCell>
                                        <TableCell>
                                            <Badge className={
                                                r.status === 'PENDING' ? 'bg-yellow-500 text-black hover:bg-yellow-600' :
                                                    r.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700' :
                                                        r.status === 'ORDERED' ? 'bg-purple-600 hover:bg-purple-700' :
                                                            r.status === 'DELIVERED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                            }>
                                                {r.status === 'PENDING' ? 'Bekliyor' : r.status === 'APPROVED' ? 'Onaylandı' : r.status === 'ORDERED' ? 'Sipariş' : r.status === 'DELIVERED' ? 'Tamamlandı' : 'Red'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {r.adminNote && <div className="italic">"{r.adminNote}"</div>}
                                            {r.deliveryDate && (
                                                <div className={new Date(r.deliveryDate) < new Date() && r.status !== 'DELIVERED' ? "text-red-600 font-bold flex items-center gap-1 mt-1" : "text-slate-600 mt-1"}>
                                                    {new Date(r.deliveryDate) < new Date() && r.status !== 'DELIVERED' && <AlertCircle size={12} />}
                                                    Teslim: {new Date(r.deliveryDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* 1. AŞAMA: ONAY / RED */}
                                            {canApprove && r.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => openProcess(r, 'APPROVED')} title="Onayla"><Check size={14} /></Button>
                                                    <Button size="icon" className="h-8 w-8 bg-red-600 hover:bg-red-700" onClick={() => openProcess(r, 'REJECTED')} title="Reddet"><X size={14} /></Button>
                                                </div>
                                            )}
                                            {/* 2. AŞAMA: SİPARİŞ VERME */}
                                            {canApprove && r.status === 'APPROVED' && (
                                                <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50 h-8 text-xs" onClick={() => openProcess(r, 'ORDERED')}><Truck size={14} className="mr-1" /> Sipariş Geç</Button>
                                            )}
                                            {/* 3. AŞAMA: MAL KABUL */}
                                            {canApprove && r.status === 'ORDERED' && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs" onClick={() => handleReceive(r.id)}><PackageCheck size={14} className="mr-1" /> Mal Kabul</Button>
                                            )}
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