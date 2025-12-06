'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useMultipleDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertTriangle, TrendingUp, Wallet, Building2,
    Clock, Truck, ArrowRight, X, RotateCcw, ShoppingCart,
    ArrowDownRight, ArrowUpRight, Package, Plus, Sun, Moon, Sunrise, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { CustomLoader } from '@/components/ui/custom-loader';
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
    const router = useRouter();
    const [selectedBranch, setSelectedBranch] = useState('ALL');
    const [user, setUser] = useState<any>(null);

    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'stats', url: '/dashboard' },
        { key: 'branches', url: '/branches' }
    ]);

    const stats = data.stats;
    const branches = data.branches || [];

    const [isMounted, setIsMounted] = useState(false);

    // Genişleyen Widget State
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [requestQty, setRequestQty] = useState<number>(10);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // --- ULTRA PREMIUM LIQUID GLASS STİLİ ---
    const GLASS_WIDGET_STYLE = "bg-white/20 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] rounded-[24px] hover:bg-white/30 transition-all duration-500 h-full flex flex-col relative group overflow-hidden ring-1 ring-white/20 cursor-pointer hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] hover:border-white/50";

    const GLASS_POPUP_STYLE = "bg-white/85 backdrop-blur-[60px] border border-white/40 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-[32px] ring-1 ring-white/60";

    // Animasyon Ayarları
    const SPRING_TRANSITION = {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        mass: 0.8
    };

    const HOVER_ANIMATION = {
        y: -5,
        scale: 1.01,
        transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    };

    // --- SAATE GÖRE SELAMLAMA ---
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Günaydın', icon: <Sunrise className="text-orange-400" size={28} />, sub: 'Güne enerjik başlama zamanı.' };
        if (hour < 18) return { text: 'Tünaydın', icon: <Sun className="text-yellow-500" size={28} />, sub: 'İşler yolunda gidiyor mu?' };
        return { text: 'İyi Akşamlar', icon: <Moon className="text-indigo-400" size={28} />, sub: 'Günü harika kapattınız.' };
    };
    const greeting = getGreeting();

    // Scroll Kilitleme
    useEffect(() => {
        if (expandedId) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                document.body.style.paddingRight = '';
                document.body.style.overflow = '';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [expandedId]);

    useEffect(() => {
        return () => {
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem('token');
        if (!token) { router.push('/'); return; }
        const userData = localStorage.getItem('user');
        if (userData) {
            const u = JSON.parse(userData);
            setUser(u);
            if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') fetchBranches();
        }
        fetchStats();
    }, []);

    useEffect(() => { if (user) fetchStats(); }, [selectedBranch]);

    const fetchBranches = async () => { try { const res = await api.get('/branches'); setBranches(res.data); } catch (e) { } }

    const fetchStats = async () => {
        setLoading(true);
        try {
            const query = selectedBranch !== 'ALL' ? `?branchId=${selectedBranch}` : '';
            const res = await api.get(`/dashboard${query}`);
            setStats(res.data);
        } catch (error) { toast.error("Veriler güncellenemedi."); }
        finally { setLoading(false); }
    };

    const handleQuickRequest = async (productId: string, productName: string) => {
        if (requestQty <= 0) {
            toast.warning("Lütfen geçerli bir miktar giriniz.");
            return;
        }
        try {
            await api.post('/requests', { productId, quantity: requestQty, reason: 'Kritik Stok', type: 'PURCHASE' });
            toast.success(`${productName} için talep oluşturuldu.`);
            fetchStats();
        } catch (e) { toast.error("Hata."); }
    }

    const openDetailModal = (type: 'VALUE' | 'PRODUCTS' | 'PENDING' | 'CRITICAL') => {
        setExpandedId(type);
    }

    const resetLayout = () => {
        window.location.reload();
    }

    if (!isMounted) return null;

    if (loading) return <AppLayout><div className="flex h-screen items-center justify-center"><CustomLoader size="xl" /></div></AppLayout>;

    if (!stats) return (
        <AppLayout>
            <div className="flex flex-col h-[50vh] items-center justify-center text-slate-500">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p>Veri yok.</p>
                <Button variant="outline" className="mt-4" onClick={fetchStats}>Tekrar Dene</Button>
            </div>
        </AppLayout>
    );

    const renderExpandedContent = (id: string) => {
        switch (id) {
            case 'VALUE':
                return (
                    <div className="p-8 h-full flex flex-col">
                        <h3 className="text-3xl font-bold mb-8 text-slate-900 flex items-center gap-3"><Wallet className="text-blue-600" /> Stok Değer Analizi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl shadow-sm backdrop-blur-md">
                                <div className="text-sm text-blue-600 font-medium uppercase tracking-wider mb-2">Toplam Tutar</div>
                                <div className="text-5xl font-bold text-blue-700 tracking-tighter tabular-nums">{(stats.kpi?.totalValue || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}</div>
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl shadow-sm backdrop-blur-md">
                                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-2">En Değerli Kategori</div>
                                <div className="text-3xl font-bold text-slate-900">{stats.pieChartData?.[0]?.name || '-'}</div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto rounded-3xl border border-slate-200/50 bg-white/40 backdrop-blur-md p-2">
                            <Table>
                                <TableHeader className="bg-white/40 sticky top-0 z-10 backdrop-blur-md"><TableRow><TableHead className="text-slate-700 font-bold">Kategori</TableHead><TableHead className="text-right text-slate-700 font-bold">Değer</TableHead></TableRow></TableHeader>
                                <TableBody>{stats?.pieChartData?.map((cat: any, i: number) => (<TableRow key={i} className="hover:bg-white/50 border-white/20"><TableCell><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div><span className="font-medium text-slate-700">{cat.name}</span></div></TableCell><TableCell className="text-right font-bold text-slate-600 tabular-nums">{cat.value.toLocaleString()} ₺</TableCell></TableRow>))}</TableBody>
                            </Table>
                        </div>
                    </div>
                );
            case 'PRODUCTS':
                return (
                    <div className="p-8 h-full flex flex-col">
                        <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3"><Package className="text-purple-600" /> Aktif Ürün Yönetimi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-purple-50/50 border border-purple-100 p-6 rounded-3xl flex flex-col justify-center">
                                <div className="text-sm text-purple-600 font-medium uppercase tracking-wide">Toplam SKU</div>
                                <div className="text-4xl font-bold text-purple-800 tracking-tighter tabular-nums">{stats.kpi?.totalProducts}</div>
                            </div>
                            <div className="md:col-span-2 bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <div className="text-lg font-bold text-slate-800">Hızlı İşlemler</div>
                                    <p className="text-sm text-slate-500">Ürün listesine git veya yeni ürün ekle.</p>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <Button onClick={() => router.push('/products')} variant="outline" className="flex-1 bg-white/60 hover:bg-white border-slate-200 h-10 rounded-xl backdrop-blur-sm">Listeye Git</Button>
                                    <Button onClick={() => router.push('/products')} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-10 rounded-xl"><Plus size={16} className="mr-2" /> Yeni Ürün</Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto rounded-3xl border border-slate-200/50 bg-white/40 backdrop-blur-md p-2">
                            <Table>
                                <TableHeader className="bg-white/40 sticky top-0 z-10 backdrop-blur-md"><TableRow><TableHead className="text-slate-700 font-bold">Kategori</TableHead><TableHead className="text-right text-slate-700 font-bold">Stok Değeri</TableHead></TableRow></TableHeader>
                                <TableBody>{stats?.pieChartData?.map((cat: any, i: number) => (<TableRow key={i} className="hover:bg-white/50 border-white/20"><TableCell><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>{cat.name}</div></TableCell><TableCell className="text-right font-mono tabular-nums">{cat.value.toLocaleString()} ₺</TableCell></TableRow>))}</TableBody>
                            </Table>
                        </div>
                    </div>
                );
            case 'CRITICAL':
                return (
                    <div className="p-8 h-full flex flex-col">
                        <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3"><AlertTriangle className="text-red-600" /> Kritik Stok Uyarısı</h3>
                        <div className="flex-1 overflow-auto rounded-3xl border border-red-200/40 bg-red-50/20 backdrop-blur-md p-1">
                            <Table>
                                <TableHeader className="bg-red-100/30 sticky top-0 z-10 backdrop-blur-md"><TableRow className="border-red-100/20"><TableHead className="text-red-900 font-bold">Ürün</TableHead><TableHead className="text-red-900 font-bold">Stok</TableHead><TableHead className="text-red-900 font-bold">Min</TableHead><TableHead className="text-red-900 font-bold">Tedarikçi</TableHead><TableHead className="text-right text-red-900 font-bold">Hızlı Sipariş</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {stats?.lists?.lowStockProducts?.map((p: any) => (
                                        <TableRow key={p.id} className="hover:bg-red-100/30 border-red-100/20">
                                            <TableCell className="font-medium text-slate-800">{p.name}</TableCell>
                                            <TableCell className="text-red-600 font-bold text-lg tabular-nums">{p.currentStock}</TableCell>
                                            <TableCell className="text-slate-600 font-medium tabular-nums">{p.minStock}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{p.supplier?.name || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Input
                                                        type="number"
                                                        className="w-20 h-8 text-sm bg-white/50 border-red-200 focus:ring-2 focus:ring-red-200/50 backdrop-blur-sm transition-all"
                                                        value={requestQty}
                                                        onChange={e => setRequestQty(Number(e.target.value))}
                                                    />
                                                    <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200/50 rounded-lg backdrop-blur-sm" onClick={() => handleQuickRequest(p.id, p.name)}><ShoppingCart size={14} className="mr-2" /> Talep Et</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                );
            case 'PENDING':
                return (
                    <div className="p-8 h-full flex flex-col">
                        <h3 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-3"><Clock className="text-orange-600" /> İşlem Merkezi</h3>
                        <div className="grid md:grid-cols-2 gap-6 h-full overflow-hidden">
                            <div className="flex flex-col overflow-hidden bg-white/30 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md">
                                <div className="p-5 bg-white/40 border-b border-white/20 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-700 text-lg">Onay Bekleyen Talepler</h4>
                                    <Button variant="ghost" size="sm" onClick={() => router.push('/requests')} className="text-blue-700 hover:text-blue-900 hover:bg-blue-50/30">Tümü &rarr;</Button>
                                </div>
                                <div className="flex-1 overflow-auto p-4 space-y-3">
                                    {stats?.lists?.pendingRequests?.length === 0 ? <p className="text-sm text-slate-400 text-center py-10">Bekleyen talep yok.</p> : (
                                        stats.lists.pendingRequests.map((r: any) => (
                                            <div key={r.id} className="bg-white/60 p-4 rounded-2xl border border-white/40 shadow-sm flex justify-between items-center hover:scale-[1.02] transition-transform cursor-pointer">
                                                <div><div className="font-bold text-slate-800">{r.product.name}</div><div className="text-xs text-slate-600 mt-0.5">{r.requester.fullName}</div></div>
                                                <Badge variant="secondary" className="bg-slate-200/50 text-slate-700 font-mono text-sm px-3 py-1 border border-white/40 tabular-nums">{r.quantity}</Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col overflow-hidden bg-white/30 rounded-3xl border border-white/40 shadow-sm backdrop-blur-md">
                                <div className="p-5 bg-white/40 border-b border-white/20 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-700">Yoldaki Siparişler</h4>
                                    <Button variant="ghost" size="sm" onClick={() => router.push('/purchase-orders')} className="text-blue-700 hover:text-blue-900 hover:bg-blue-50/30">Detaylar &rarr;</Button>
                                </div>
                                <div className="flex-1 overflow-auto p-4 space-y-3">
                                    {stats?.lists?.incomingOrders?.length === 0 ? <p className="text-sm text-slate-400 text-center py-10">Yolda sipariş yok.</p> : (
                                        stats.lists.incomingOrders.map((o: any) => (
                                            <div key={o.id} className="bg-white/60 p-4 rounded-2xl border border-white/40 shadow-sm flex justify-between items-center hover:scale-[1.02] transition-transform cursor-pointer">
                                                <div><div className="font-bold text-slate-800">{o.supplier.name}</div><div className="text-xs text-slate-600 mt-0.5 font-mono">{o.orderNumber}</div></div>
                                                <div className="bg-blue-500/10 p-2 rounded-full text-blue-700 shadow-sm border border-blue-200/30"><Truck size={18} /></div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default: return <div className="p-10 text-center">Yükleniyor...</div>;
        }
    }

    return (
        <AppLayout>
            {/* --- AMBIENT BACKGROUND --- */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50">
                {/* Hareketli Gradient Blobları */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 10, -10, 0],
                        x: [0, 50, -50, 0],
                        y: [0, 30, -30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, -15, 15, 0],
                        x: [0, -60, 60, 0],
                        y: [0, -40, 40, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-400/10 blur-[120px]"
                />
            </div>

            <AnimatePresence>
                {expandedId && (
                    <>
                        {/* Perde */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[4px] z-[60]"
                            onClick={() => setExpandedId(null)}
                        />
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
                            <motion.div
                                layoutId={expandedId}
                                className={`w-full max-w-6xl h-auto max-h-[85vh] pointer-events-auto overflow-hidden relative flex flex-col ${GLASS_POPUP_STYLE}`}
                                transition={SPRING_TRANSITION}
                            >
                                <button onClick={() => setExpandedId(null)} className="absolute top-6 right-6 z-50 p-2.5 bg-white/40 hover:bg-white rounded-full transition-all shadow-sm hover:shadow-md group border border-white/20 backdrop-blur-md">
                                    <X size={24} className="text-slate-500 group-hover:text-slate-800" />
                                </button>

                                <div className="flex-1 overflow-hidden">
                                    {renderExpandedContent(expandedId)}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{greeting.icon}</span>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 drop-shadow-sm">{greeting.text}, {user?.fullName.split(' ')[0]}</h1>
                    </div>
                    <p className="text-base text-slate-500 font-medium ml-9">{greeting.sub}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={resetLayout} className="h-10 bg-white/50 hover:bg-white border-slate-200 text-slate-600 shadow-sm backdrop-blur rounded-xl">
                        <RotateCcw className="mr-2 h-3.5 w-3.5" /> Yenile
                    </Button>

                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                        <div className="flex items-center gap-2 bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/50 shadow-sm z-20">
                            <Building2 size={18} className="text-slate-400 ml-2" />
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger className="w-[200px] border-none shadow-none h-10 focus:ring-0 bg-transparent font-semibold text-slate-700"><SelectValue placeholder="Tüm Şubeler" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tüm Şirket</SelectItem>
                                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {/* --- STATİK GRID DÜZENİ --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                {/* KPI 1: Toplam Değer */}
                <motion.div layoutId="VALUE" className={`h-40 cursor-pointer group relative border-l-[6px] border-l-blue-500 ${GLASS_WIDGET_STYLE}`} onClick={() => openDetailModal('VALUE')} whileHover={HOVER_ANIMATION}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Wallet size={16} className="text-blue-500" /> Toplam Değer</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{(stats.kpi?.totalValue || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-blue-600 mt-3 flex items-center gap-1 font-bold opacity-60 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1">Detayları İncele <ArrowRight size={10} /></p>
                    </CardContent>
                </motion.div>

                {/* KPI 2: Aktif Ürünler (POPUP OLARAK AÇILIR) */}
                <motion.div layoutId="PRODUCTS" className={`h-40 cursor-pointer group relative border-l-[6px] border-l-purple-500 ${GLASS_WIDGET_STYLE}`} onClick={() => openDetailModal('PRODUCTS')} whileHover={HOVER_ANIMATION}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Package size={16} className="text-purple-500" /> Aktif Ürün</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{stats.kpi?.totalProducts || 0} <span className="text-sm font-normal text-slate-400">SKU</span></div>
                        <p className="text-xs text-purple-600 mt-3 flex items-center gap-1 font-bold opacity-60 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1">Yönetim Paneli <ArrowRight size={10} /></p>
                    </CardContent>
                </motion.div>

                {/* KPI 3: Bekleyen İşler */}
                <motion.div layoutId="PENDING" className={`h-40 cursor-pointer group relative border-l-[6px] border-l-orange-500 ${GLASS_WIDGET_STYLE}`} onClick={() => openDetailModal('PENDING')} whileHover={HOVER_ANIMATION}>
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Clock size={16} className="text-orange-500" /> Bekleyen</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{(stats.kpi?.pendingRequestCount || 0) + (stats.kpi?.incomingOrderCount || 0)}</div>
                        <p className="text-xs text-orange-600 mt-3 flex items-center gap-1 font-bold opacity-60 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1">Hemen İncele <ArrowRight size={10} /></p>
                    </CardContent>
                </motion.div>

                {/* KPI 4: Kritik Stok */}
                <motion.div layoutId="CRITICAL" className={`h-40 cursor-pointer group relative border-l-[6px] ${GLASS_WIDGET_STYLE} ${stats.kpi?.criticalCount > 0 ? 'border-l-red-500 bg-red-50/10' : 'border-l-green-500'}`} onClick={() => openDetailModal('CRITICAL')} whileHover={HOVER_ANIMATION}>
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stats.kpi?.criticalCount > 0 ? 'from-red-500/10' : 'from-green-500/10'}`} />
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><AlertTriangle size={16} className={stats.kpi?.criticalCount > 0 ? "text-red-500" : "text-green-500"} /> Kritik Stok</CardTitle></CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold tracking-tight tabular-nums ${stats.kpi?.criticalCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.kpi?.criticalCount || 0}</div>
                        {stats.kpi?.criticalCount > 0 ?
                            <p className="text-xs text-red-600 mt-3 flex items-center gap-1 font-bold opacity-60 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1">Aksiyon Al <ArrowRight size={10} /></p> :
                            <p className="text-xs text-green-600 mt-3 font-bold opacity-60">Stoklar güvende</p>
                        }
                    </CardContent>
                </motion.div>
            </div>

            {/* 2. SATIR: GRAFİKLER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-[450px]">
                <div className={`col-span-2 ${GLASS_WIDGET_STYLE} p-0 overflow-hidden group`}>
                    <div className="p-8 h-full flex flex-col">
                        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-blue-600" /> Haftalık Hareket Hacmi</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.chartData || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', fontSize: '12px' }} />
                                    <Legend iconSize={8} wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Giris" name="Giriş" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Cikis" name="Çıkış" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className={`${GLASS_WIDGET_STYLE} p-0 overflow-hidden group`}>
                    <div className="p-8 h-full flex flex-col">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-3"><Wallet size={18} className="text-purple-600" /> Stok Değer Dağılımı</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats?.pieChartData || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={6} dataKey="value" stroke="none">
                                        {(stats.pieChartData || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} ₺`} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', fontSize: '12px' }} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. SATIR: LİSTELER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[450px] mb-8">
                <div className={`${GLASS_WIDGET_STYLE} p-0 overflow-hidden group`}>
                    <div className="p-6 border-b border-white/20 bg-white/10 backdrop-blur-md"><h3 className="text-sm font-bold text-slate-700">Son Hareketler</h3></div>
                    <div className="flex-1 overflow-auto p-2 scrollbar-hide">
                        <Table>
                            <TableBody>
                                {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
                                    <TableRow><TableCell colSpan={2} className="py-12 text-center text-xs text-slate-400">Henüz işlem yok.</TableCell></TableRow>
                                ) : (
                                    stats.recentActivity.map((tx: any, i: number) => (
                                        <TableRow key={i} className="hover:bg-blue-50/30 border-b border-white/10 transition-colors">
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex flex-col"><span className="font-bold text-sm text-slate-800 truncate max-w-[150px]">{tx.product}</span><span className="text-[11px] text-slate-500 font-medium">{new Date(tx.time).toLocaleDateString('tr-TR')}</span></div>
                                            </TableCell>
                                            <TableCell className="text-right py-4 pr-6">
                                                <Badge variant={tx.action === 'Giriş' ? 'default' : 'destructive'} className={`text-[10px] px-2.5 py-1 font-bold shadow-sm border-0 ${tx.action === 'Giriş' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {tx.action === 'Giriş' ? <ArrowDownRight size={12} className="mr-1" /> : <ArrowUpRight size={12} className="mr-1" />} {tx.quantity}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className={`${GLASS_WIDGET_STYLE} p-0 overflow-hidden group`}>
                    <div className="p-6 border-b border-white/20 bg-white/10 backdrop-blur-md"><h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Truck size={16} className="text-blue-600" /> Yoldaki Siparişler</h3></div>
                    <div className="flex-1 overflow-auto p-4 scrollbar-hide space-y-3">
                        {(!stats.lists?.incomingOrders || stats.lists.incomingOrders.length === 0) ? <div className="py-12 text-center text-sm text-slate-400 font-medium">Bekleyen sipariş yok.</div> : (
                            stats.lists.incomingOrders.map((ord: any) => (
                                <div key={ord.id} className="flex items-center justify-between p-5 bg-white/30 hover:bg-white/50 transition-all rounded-2xl border border-white/30 shadow-sm cursor-pointer" onClick={() => router.push('/purchase-orders')}>
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{ord.supplier.name}</div>
                                        <div className="text-[11px] text-slate-500 font-mono mt-1 bg-white/40 px-1.5 py-0.5 rounded w-fit border border-white/20">{ord.orderNumber}</div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 text-xs px-3 bg-white/50 border-white/40 hover:bg-white hover:text-blue-600 shadow-sm rounded-xl font-medium">İncele</Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </AppLayout>
    );
}