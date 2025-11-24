'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Building2, Wallet, BarChart3, Calendar, FilterX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { getQuickDateRange } from '@/lib/date-utils';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Tarih ve Filtre State'leri
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [activeFilter, setActiveFilter] = useState<string>('THIS_MONTH'); // Hangi buton aktif?

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/'); return; }

        const userData = localStorage.getItem('user');
        if (userData) {
            const u = JSON.parse(userData);
            setUser(u);
            if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') fetchBranches();
        }

        // Varsayılan: Bu Ay
        handleQuickDate('THIS_MONTH');
    }, [router]);

    useEffect(() => {
        if (user && dateRange.start) fetchStats();
    }, [selectedBranch, dateRange]);

    const fetchBranches = async () => {
        try { const res = await api.get('/branches'); setBranches(res.data); } catch (e) { }
    }

    const fetchStats = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (selectedBranch !== 'ALL') queryParams.append('branchId', selectedBranch);
            if (dateRange.start) queryParams.append('startDate', dateRange.start);
            if (dateRange.end) queryParams.append('endDate', dateRange.end);

            const res = await api.get(`/dashboard?${queryParams.toString()}`);
            setStats(res.data);
        } catch (error) { toast.error("Veriler çekilemedi."); }
        finally { setLoading(false); }
    };

    // Hızlı Tarih Seçimi ve Görsel Vurgu
    const handleQuickDate = (type: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH') => {
        setActiveFilter(type);
        setDateRange(getQuickDateRange(type));
    };

    // Manuel tarih değişirse buton vurgusunu kaldır
    const handleManualDateChange = (field: 'start' | 'end', value: string) => {
        setActiveFilter('CUSTOM');
        setDateRange(prev => ({ ...prev, [field]: value }));
    };

    // Filtre Temizle
    const clearFilters = () => {
        setSelectedBranch('ALL');
        handleQuickDate('THIS_MONTH');
        toast.info("Filtreler varsayılana döndürüldü.");
    }

    if (loading && !stats) {
        return (
            <AppLayout>
                <div className="p-6 space-y-4"><Skeleton className="h-12 w-full" /><div className="grid grid-cols-3 gap-4"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div></div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hoşgeldin, {user?.fullName} 👋</h1>
                    <p className="text-sm text-slate-500">{user?.company} - Operasyon Özeti</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white/60 backdrop-blur-md p-1.5 rounded-xl border shadow-sm">
                    {/* HIZLI TARİH BUTONLARI (Active state ile renklenir) */}
                    <div className="flex bg-slate-100/50 p-1 rounded-lg gap-1">
                        <Button variant={activeFilter === 'YESTERDAY' ? 'default' : 'ghost'} size="sm" className="h-8 text-xs px-3" onClick={() => handleQuickDate('YESTERDAY')}>Dün</Button>
                        <Button variant={activeFilter === 'TODAY' ? 'default' : 'ghost'} size="sm" className="h-8 text-xs px-3" onClick={() => handleQuickDate('TODAY')}>Bugün</Button>
                        <Button variant={activeFilter === 'THIS_WEEK' ? 'default' : 'ghost'} size="sm" className="h-8 text-xs px-3" onClick={() => handleQuickDate('THIS_WEEK')}>Bu Hafta</Button>
                        <Button variant={activeFilter === 'THIS_MONTH' ? 'default' : 'ghost'} size="sm" className="h-8 text-xs px-3" onClick={() => handleQuickDate('THIS_MONTH')}>Bu Ay</Button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

                    {/* TARİH SEÇİCİ (Manuel değişirse CUSTOM olur) */}
                    <div className="flex items-center gap-2 px-2">
                        <Calendar size={16} className="text-slate-400" />
                        <Input type="date" className="h-8 w-auto border-none bg-transparent focus-visible:ring-0 px-1 text-xs shadow-none p-0" value={dateRange.start} onChange={e => handleManualDateChange('start', e.target.value)} />
                        <span className="text-slate-300">-</span>
                        <Input type="date" className="h-8 w-auto border-none bg-transparent focus-visible:ring-0 px-1 text-xs shadow-none p-0" value={dateRange.end} onChange={e => handleManualDateChange('end', e.target.value)} />
                    </div>

                    {/* ŞUBE FİLTRESİ */}
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                        <>
                            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>
                            <div className="flex items-center gap-2 px-2">
                                <Building2 size={16} className="text-slate-400" />
                                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                    <SelectTrigger className="w-[140px] border-none shadow-none h-8 focus:ring-0 bg-transparent text-xs"><SelectValue placeholder="Tüm Şubeler" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tüm Şirket</SelectItem>
                                        {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {/* TEMİZLE BUTONU (Sadece filtre varsa görünür) */}
                    {(activeFilter === 'CUSTOM' || selectedBranch !== 'ALL') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={clearFilters} title="Filtreleri Temizle">
                            <FilterX size={16} />
                        </Button>
                    )}
                </div>
            </div>

            {/* KARTLAR */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="shadow-lg border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-lg hover:-translate-y-1 transition-transform">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Toplam Ürün</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{stats?.totalProducts}</div>
                        <p className="text-xs text-slate-500 mt-1">Farklı SKU sayısı</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-l-4 border-l-red-500 bg-white/80 backdrop-blur-lg hover:-translate-y-1 transition-transform">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Kritik Stok</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${stats?.lowStockCount! > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats?.lowStockCount! > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {stats?.lowStockCount}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Min. seviye altındaki ürünler</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-l-4 border-l-green-500 bg-white/80 backdrop-blur-lg hover:-translate-y-1 transition-transform">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Envanter Değeri</CardTitle>
                        <Wallet className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats?.totalValue?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0 ₺'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Tahmini toplam maliyet</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7 mb-6">
                {/* GRAFİK ALANI */}
                <Card className="md:col-span-4 shadow-lg bg-white/80 backdrop-blur-lg border-slate-100">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><BarChart3 size={18} /> İşlem Hacmi</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Giris" name="Giriş" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="Cikis" name="Çıkış" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* PASTA GRAFİK */}
                <Card className="md:col-span-3 shadow-lg bg-white/80 backdrop-blur-lg border-slate-100">
                    <CardHeader>
                        <CardTitle className="text-lg">Stok Dağılımı (Değer)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats?.pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {stats?.pieChartData?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} ₺`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SON İŞLEMLER TABLOSU */}
            <Card className="shadow-lg bg-white/80 backdrop-blur-lg border-slate-100">
                <CardHeader>
                    <CardTitle className="text-lg">Son Hareketler</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            {stats?.recentActivity.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-24 text-slate-500">Henüz işlem yok.</TableCell></TableRow>
                            ) : (
                                stats?.recentActivity.map((tx: any, i: number) => (
                                    <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{tx.product}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(tx.time).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <Badge variant={tx.action === 'Giriş' ? 'default' : 'destructive'} className={`gap-1 px-1.5 py-0 h-5 text-[10px] ${tx.action === 'Giriş' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                                                    {tx.action === 'Giriş' ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                                                    {tx.quantity}
                                                </Badge>
                                                <span className="text-[10px] text-slate-500 mt-1">{tx.user}</span>
                                            </div>
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