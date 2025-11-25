'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, AlertCircle, CheckCircle2, CalendarClock, TrendingUp, History } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CustomLoader } from '@/components/ui/custom-loader';
// EKSİK OLAN IMPORT EKLENDİ 👇
import { Badge } from '@/components/ui/badge';

export default function FinancePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await api.get('/transactions/finance');
            setData(res.data);
        } catch (e) { toast.error("Finans verileri çekilemedi."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handlePay = async (id: string) => {
        if (!confirm("Ödeme yapıldı olarak işaretlensin mi?")) return;
        try { await api.patch(`/transactions/${id}/pay`); toast.success("Kaydedildi."); fetchData(); }
        catch (e) { toast.error("Hata."); }
    }

    if (loading) return <AppLayout><div className="h-screen flex items-center justify-center"><CustomLoader size="xl" /></div></AppLayout>;
    if (!data) return <AppLayout>Veri yok.</AppLayout>;

    return (
        <AppLayout>
            <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Finansal Durum</h1></div>

            {/* ÖZET KARTLARI */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="bg-white border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Toplam Borç</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Wallet className="text-red-500" /> {data.totalDebt.toLocaleString('tr-TR')} ₺</div></CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Vadesi Geçen</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-orange-600 flex items-center gap-2"><AlertCircle /> {data.overdueAmount.toLocaleString('tr-TR')} ₺</div></CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium">Bekleyen İşlem</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600 flex items-center gap-2"><CalendarClock /> {data.unpaidTransactions.length} Adet</div></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-6">
                {/* ANALİZ: EN ÇOK HARCANAN TEDARİKÇİLER */}
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp size={16} /> En Çok Harcama Yapılan Tedarikçiler</CardTitle></CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topSuppliers} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} style={{ fontSize: '12px' }} />
                                <Tooltip formatter={(val: number) => `${val.toLocaleString()} ₺`} />
                                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                    {data.topSuppliers.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* ANALİZ: EN ÇOK ALINAN ÜRÜNLER (TUTAR BAZLI) */}
                <Card>
                    <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp size={16} /> En Çok Tutar Tutan Ürünler</CardTitle></CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} style={{ fontSize: '12px' }} />
                                <Tooltip formatter={(val: number) => `${val.toLocaleString()} ₺`} />
                                <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* TABLOLAR: BEKLEYEN & GEÇMİŞ */}
            <Tabs defaultValue="unpaid" className="w-full">
                <TabsList>
                    <TabsTrigger value="unpaid">Ödeme Bekleyenler</TabsTrigger>
                    <TabsTrigger value="history">Ödeme Geçmişi</TabsTrigger>
                </TabsList>

                <TabsContent value="unpaid">
                    <Card className="shadow-sm border-0"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Vade Tarihi</TableHead><TableHead>Tedarikçi</TableHead><TableHead>Ürün/Açıklama</TableHead><TableHead>Tutar</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader><TableBody>
                        {data.unpaidTransactions.length === 0 ? (<TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500">Harika! Hiç borcunuz yok.</TableCell></TableRow>) : data.unpaidTransactions.map((tx: any) => (
                            <TableRow key={tx.id} className={tx.isOverdue ? 'bg-red-50' : ''}>
                                <TableCell className={`font-mono text-sm ${tx.isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{new Date(tx.dueDate).toLocaleDateString('tr-TR')}{tx.isOverdue && <span className="ml-2 text-[10px] bg-red-100 px-1 rounded text-red-600">GECİKMİŞ</span>}</TableCell>
                                <TableCell>{tx.supplier}</TableCell><TableCell>{tx.product}</TableCell><TableCell className="font-bold">{tx.amount.toLocaleString('tr-TR')} ₺</TableCell>
                                <TableCell className="text-right"><Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handlePay(tx.id)}><CheckCircle2 size={14} className="mr-1" /> Öde</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody></Table></CardContent></Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="shadow-sm border-0"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Ödeme Tarihi</TableHead><TableHead>Tedarikçi</TableHead><TableHead>Ürün</TableHead><TableHead>Tutar</TableHead><TableHead className="text-right">Durum</TableHead></TableRow></TableHeader><TableBody>
                        {data.paidHistory.length === 0 ? (<TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500">Geçmiş işlem yok.</TableCell></TableRow>) : data.paidHistory.map((tx: any) => (
                            <TableRow key={tx.id}>
                                <TableCell className="text-slate-500">{new Date(tx.date).toLocaleDateString('tr-TR')}</TableCell>
                                <TableCell>{tx.supplier}</TableCell><TableCell>{tx.product}</TableCell><TableCell className="font-bold">{tx.amount.toLocaleString('tr-TR')} ₺</TableCell>
                                <TableCell className="text-right"><Badge className="bg-green-100 text-green-700 hover:bg-green-100"><History size={12} className="mr-1" /> Ödendi</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody></Table></CardContent></Card>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}