'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertCircle, CheckCircle2, CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await api.get('/transactions/finance');
            setData(res.data);
        } catch (e) {
            console.error(e);
            // Hata olsa bile boş bir data seti koyalım ki sayfa çökmesin
            setData({ totalDebt: 0, overdueAmount: 0, unpaidTransactions: [] });
            toast.error("Finans verileri çekilemedi.");
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePay = async (id: string) => {
        if (!confirm("Bu ödemeyi 'Tamamlandı' olarak işaretlemek istiyor musunuz?")) return;
        try {
            await api.patch(`/transactions/${id}/pay`);
            toast.success("Ödeme kaydedildi.");
            fetchData();
        } catch (e) { toast.error("Hata."); }
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </AppLayout>
        );
    }

    // Veri boşsa veya yüklenemediyse koruma
    if (!data) return <AppLayout><div className="p-8 text-center">Veri bulunamadı.</div></AppLayout>;

    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Finansal Durum</h1>
                <p className="text-sm text-slate-500">Tedarikçi ödemeleri ve nakit akışı takibi.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-white border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Toplam Borç</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {/* HATA ÇÖZÜMÜ: data?.totalDebt || 0 */}
                            <Wallet className="text-red-500" /> {(data?.totalDebt || 0).toLocaleString('tr-TR')} ₺
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Vadesi Geçen</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                            {/* HATA ÇÖZÜMÜ: data?.overdueAmount || 0 */}
                            <AlertCircle /> {(data?.overdueAmount || 0).toLocaleString('tr-TR')} ₺
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Acil ödenmesi gereken</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Bekleyen İşlem</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                            {/* HATA ÇÖZÜMÜ: ?.length */}
                            <CalendarClock /> {data?.unpaidTransactions?.length || 0} Adet
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-0">
                <CardHeader><CardTitle>Ödeme Bekleyenler</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead>Vade Tarihi</TableHead><TableHead>Tedarikçi</TableHead><TableHead>Ürün/Açıklama</TableHead><TableHead>Tutar</TableHead><TableHead className="text-right">Durum</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {(!data?.unpaidTransactions || data.unpaidTransactions.length === 0) ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500">Harika! Hiç borcunuz yok.</TableCell></TableRow>
                            ) : (
                                data.unpaidTransactions.map((tx: any) => (
                                    <TableRow key={tx.id} className={tx.isOverdue ? 'bg-red-50/50' : ''}>
                                        <TableCell className={`font-mono text-sm ${tx.isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                            {new Date(tx.dueDate).toLocaleDateString('tr-TR')}
                                            {tx.isOverdue && <span className="block text-[10px] text-red-500">GECİKMİŞ</span>}
                                        </TableCell>
                                        <TableCell className="font-medium">{tx.supplier}</TableCell>
                                        <TableCell>{tx.product}</TableCell>
                                        <TableCell className="font-bold">{tx.amount.toLocaleString('tr-TR')} ₺</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50" onClick={() => handlePay(tx.id)}>
                                                <CheckCircle2 size={14} className="mr-1" /> Ödendi İşaretle
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}