'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle, CheckCircle2, CalendarClock, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { CustomLoader } from '@/components/ui/custom-loader';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function FinancePage() {
    const [expandedSuppliers, setExpandedSuppliers] = useState<string[]>([]);

    const { data, loading, refetch } = useDataFetch('/transactions/finance');

    const handlePay = async (id: string) => {
        if (!confirm("Ödendi olarak işaretlensin mi?")) return;
        try { await api.patch(`/transactions/${id}/pay`); toast.success("Kaydedildi."); refetch(); }
        catch (e) { /* Global error handler */ }
    }

    const toggleSupplier = (supplierName: string) => {
        setExpandedSuppliers(prev =>
            prev.includes(supplierName) ? prev.filter(s => s !== supplierName) : [...prev, supplierName]
        );
    }

    if (loading) return <AppLayout><div className="h-screen flex items-center justify-center"><CustomLoader size="xl" /></div></AppLayout>;
    if (!data) return <AppLayout>Veri yok.</AppLayout>;

    // Borçları Tedarikçiye Göre Grupla
    const groupedDebts = data.unpaidTransactions.reduce((acc: any, tx: any) => {
        const sup = tx.supplier || 'Diğer';
        if (!acc[sup]) acc[sup] = { total: 0, transactions: [] };
        acc[sup].transactions.push(tx);
        acc[sup].total += tx.amount;
        return acc;
    }, {});

    return (
        <AppLayout>
            {/* ... (Özet Kartları - Aynı kalsın) ... */}
            <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Finansal Durum</h1></div>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-white border-l-4 border-l-red-500 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Toplam Borç</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Wallet className="text-red-500" /> {data.totalDebt.toLocaleString()} ₺</div></CardContent></Card>
                <Card className="bg-white border-l-4 border-l-orange-500 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Vadesi Geçen</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600 flex items-center gap-2"><AlertCircle /> {data.overdueAmount.toLocaleString()} ₺</div></CardContent></Card>
                <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">İşlem Sayısı</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600 flex items-center gap-2"><CalendarClock /> {data.unpaidTransactions.length}</div></CardContent></Card>
            </div>

            {/* GRUPLANMIŞ BORÇ LİSTESİ */}
            <h2 className="text-lg font-bold text-slate-700 mb-4">Tedarikçi Bazlı Borçlar</h2>
            <div className="space-y-3">
                {Object.keys(groupedDebts).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-white rounded border">Harika! Hiç borcunuz yok. 🎉</div>
                ) : (
                    Object.entries(groupedDebts).map(([supplier, info]: any) => (
                        <div key={supplier} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                            {/* HEADER (Tıklanabilir) */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleSupplier(supplier)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Truck size={20} /></div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{supplier}</h3>
                                        <p className="text-xs text-slate-500">{info.transactions.length} adet işlem</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-bold text-red-600 text-lg">{info.total.toLocaleString()} ₺</div>
                                        <div className="text-xs text-slate-400">Toplam Borç</div>
                                    </div>
                                    {expandedSuppliers.includes(supplier) ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                                </div>
                            </div>

                            {/* DETAYLAR (Animasyonlu) */}
                            <AnimatePresence>
                                {expandedSuppliers.includes(supplier) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t bg-slate-50/50"
                                    >
                                        <div className="p-4">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Vade</TableHead><TableHead>Ürün</TableHead><TableHead>Tutar</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {info.transactions.map((tx: any) => (
                                                        <TableRow key={tx.id} className={tx.isOverdue ? 'bg-red-50' : ''}>
                                                            <TableCell className={`font-mono text-sm ${tx.isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                                                {new Date(tx.dueDate).toLocaleDateString()}
                                                                {tx.isOverdue && <span className="ml-2 text-[10px] bg-red-100 px-1 rounded text-red-600">GECİKMİŞ</span>}
                                                            </TableCell>
                                                            <TableCell>{tx.product}</TableCell>
                                                            <TableCell className="font-bold">{tx.amount.toLocaleString()} ₺</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 h-7 text-xs" onClick={() => handlePay(tx.id)}>Öde</Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}