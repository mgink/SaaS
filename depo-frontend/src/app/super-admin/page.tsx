'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, Database, Crown, MoreHorizontal, Ban, Trash2, CreditCard, CheckCircle, Loader2, Edit2, Plus, Star, Check, GripVertical, Mail, Phone, Globe, FileText } from 'lucide-react';
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function SuperAdminPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- STATE'LER ---

    // Şirket Düzenleme (Sheet)
    const [selectedTenant, setSelectedTenant] = useState<any>(null);
    const [isTenantSheetOpen, setIsTenantSheetOpen] = useState(false);

    // Paket Düzenleme (Dialog)
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

    // Paket Formu
    const [planForm, setPlanForm] = useState({
        name: '', code: '', price: 0, maxUsers: 0, maxProducts: 0, maxWarehouses: 0, features: '',
        isPopular: false, isFree: false, isContact: false, isActive: true
    });

    const [saving, setSaving] = useState(false);

    // --- VERİ ÇEKME ---
    const fetchData = async () => {
        try {
            const [statsRes, plansRes, reqRes] = await Promise.all([
                api.get('/super-admin/dashboard'),
                api.get('/super-admin/plans'),
                api.get('/super-admin/requests')
            ]);
            setStats(statsRes.data);
            setPlans(plansRes.data);
            setRequests(reqRes.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => {
        const localUser = localStorage.getItem('user');
        if (!localUser || JSON.parse(localUser).role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [router]);

    // --- PLAN İŞLEMLERİ (DRAG & DROP, CREATE, UPDATE, DELETE) ---

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        const items = Array.from(plans);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setPlans(items); // UI güncelle
        const orderPayload = items.map((plan, index) => ({ id: plan.id, order: index }));
        try { await api.post('/super-admin/plans/reorder', orderPayload); toast.success("Sıralama güncellendi."); } catch (e) { toast.error("Sıralama hatası."); }
    };

    const openPlanDialog = (plan: any = null) => {
        if (plan) {
            setSelectedPlan(plan);
            setPlanForm({
                name: plan.name, code: plan.code, price: plan.price,
                maxUsers: plan.maxUsers, maxProducts: plan.maxProducts, maxWarehouses: plan.maxWarehouses,
                features: plan.features.join('\n'),
                isPopular: plan.isPopular,
                isFree: plan.price === 0 && plan.code !== 'ENTERPRISE',
                isContact: plan.code === 'ENTERPRISE',
                isActive: plan.isActive
            });
        } else {
            setSelectedPlan(null);
            setPlanForm({
                name: '', code: '', price: 0, maxUsers: 10, maxProducts: 1000, maxWarehouses: 1, features: '',
                isPopular: false, isFree: false, isContact: false, isActive: true
            });
        }
        setIsPlanDialogOpen(true);
    };

    const handlePlanSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        let finalPrice = Number(planForm.price);
        if (planForm.isFree || planForm.isContact) finalPrice = 0;

        let finalUsers = Number(planForm.maxUsers);
        let finalProducts = Number(planForm.maxProducts);
        let finalWarehouses = Number(planForm.maxWarehouses);

        // Enterprise ise limitleri 0 (sınırsız) yap
        if (planForm.isContact) { finalUsers = 0; finalProducts = 0; finalWarehouses = 0; }

        const payload = {
            name: planForm.name, code: planForm.code, price: finalPrice,
            maxUsers: finalUsers, maxProducts: finalProducts, maxWarehouses: finalWarehouses,
            features: planForm.features.split('\n').filter(f => f.trim() !== ''),
            isPopular: planForm.isPopular,
            isActive: planForm.isActive
        };

        try {
            if (selectedPlan) { await api.patch(`/super-admin/plans/${selectedPlan.id}`, payload); toast.success("Paket güncellendi."); }
            else { await api.post('/super-admin/plans', payload); toast.success("Paket oluşturuldu."); }
            setIsPlanDialogOpen(false); fetchData();
        } catch (error: any) { toast.error("İşlem başarısız."); } finally { setSaving(false); }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        try { await api.delete(`/super-admin/plans/${id}`); toast.success("Paket silindi."); fetchData(); } catch (e: any) { toast.error(e.response?.data?.message || "Silinemedi."); }
    };

    // --- ŞİRKET İŞLEMLERİ (DETAYLI EDİT) ---

    const openTenantEdit = (tenant: any) => {
        setSelectedTenant({
            ...tenant,
            phone: tenant.phone || '',
            address: tenant.address || '',
            taxNo: tenant.taxNo || '',
            taxOffice: tenant.taxOffice || '',
            contactName: tenant.contactName || '',
            website: tenant.website || '',
            planId: tenant.plan?.id
        });
        setIsTenantSheetOpen(true);
    }

    const handleTenantUpdate = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            await api.patch(`/super-admin/tenants/${selectedTenant.id}`, selectedTenant);
            setIsTenantSheetOpen(false); fetchData(); toast.success("Şirket güncellendi.");
        } catch (e) { toast.error("Hata."); } finally { setSaving(false); }
    };

    const handleDeleteTenant = async (id: string) => {
        if (!confirm("DİKKAT: Şirketi silmek üzeresiniz!")) return;
        try { await api.delete(`/super-admin/tenants/${id}`); fetchData(); toast.info("Şirket silindi."); } catch (e) { toast.error("Hata."); }
    }

    // --- TALEP İŞLEMLERİ ---
    const handleRequestStatus = async (id: string, status: string) => {
        try { await api.patch(`/super-admin/requests/${id}`, { status }); fetchData(); toast.success("Talep güncellendi."); } catch (e) { toast.error("Hata."); }
    }

    if (loading || !stats) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div></AppLayout>;

    return (
        <AppLayout>
            <div className="mb-6"><h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900"><Crown className="text-yellow-500 fill-yellow-500" /> Super Admin Paneli</h1></div>

            {/* İSTATİSTİK KARTLARI */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card className="bg-slate-900 text-white border-none"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-300">Şirketler</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.overview.totalTenants}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Kullanıcılar</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><Users className="h-4 w-4" />{stats.overview.totalUsers}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Ürünler</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><Database className="h-4 w-4" />{stats.overview.totalProducts}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Gelir</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-1 text-xs">{Object.entries(stats.overview.planDistribution || {}).map(([key, val]: any) => (<Badge key={key} variant="outline">{key}: {val}</Badge>))}</div></CardContent></Card>
            </div>

            <Tabs defaultValue="tenants" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="tenants">Şirket Listesi</TabsTrigger>
                    <TabsTrigger value="plans">Paket Yönetimi</TabsTrigger>
                    <TabsTrigger value="requests">Talepler ({requests.filter(r => r.status === 'PENDING').length})</TabsTrigger>
                </TabsList>

                {/* --- 1. SEKME: ŞİRKET LİSTESİ --- */}
                <TabsContent value="tenants" className="mt-4">
                    <Card className="shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-6">Durum</TableHead><TableHead>Şirket</TableHead><TableHead>İletişim</TableHead><TableHead>Plan</TableHead><TableHead>Limitler</TableHead><TableHead className="text-right pr-6">Yönet</TableHead></TableRow></TableHeader><TableBody>{stats.tenants.map((t: any) => (<TableRow key={t.id} className={!t.isActive ? "bg-red-50/50" : ""}><TableCell className="pl-6">{t.isActive ? <CheckCircle className="text-green-500 h-5 w-5" /> : <Ban className="text-red-500 h-5 w-5" />}</TableCell><TableCell><div className="font-medium">{t.name}</div><div className="text-xs text-slate-500">{t.subdomain}.saasdepo.com</div></TableCell><TableCell><div className="flex flex-col text-xs text-slate-500">{t.phone && <span>{t.phone}</span>}{t.contactName && <span className="font-medium">{t.contactName}</span>}</div></TableCell><TableCell><Badge variant="outline">{t.plan?.name || 'Yok'}</Badge></TableCell><TableCell>{t.userCount} / {t.productCount}</TableCell><TableCell className="text-right pr-6"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openTenantEdit(t)}><CreditCard className="mr-2 h-4 w-4" /> Detaylı Düzenle</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteTenant(t.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Sil</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
                </TabsContent>

                {/* --- 2. SEKME: PAKET YÖNETİMİ --- */}
                <TabsContent value="plans" className="mt-4">
                    <div className="flex justify-end mb-4"><Button onClick={() => openPlanDialog(null)} className="bg-blue-600 hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" /> Yeni Paket</Button></div>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="plans" direction="horizontal">
                            {(provided) => (
                                <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4" {...provided.droppableProps} ref={provided.innerRef}>
                                    {plans.map((plan, index) => (
                                        <Draggable key={plan.id} draggableId={plan.id} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} className="h-full">
                                                    <Card className={`relative flex flex-col h-full ${!plan.isActive ? 'opacity-60 border-dashed' : ''} ${plan.isPopular ? 'border-yellow-400 border-2 bg-yellow-50/20' : ''}`}>
                                                        <div {...provided.dragHandleProps} className="absolute top-2 left-2 cursor-grab text-slate-400 hover:text-slate-600"><GripVertical size={20} /></div>

                                                        {plan.isPopular && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] px-2 py-1 font-bold rounded-bl-lg">POPÜLER</div>}
                                                        {!plan.isActive && <div className="absolute top-0 right-8 bg-slate-200 text-slate-600 text-[10px] px-2 py-1 font-bold rounded">PASİF</div>}

                                                        <CardHeader className="pt-10">
                                                            <CardTitle className="flex justify-between items-center text-lg">{plan.name}</CardTitle>
                                                            <div className="text-2xl font-bold">{plan.price === 0 ? (plan.code === 'ENTERPRISE' ? 'Teklif' : 'Ücretsiz') : `${plan.price} ₺`}{plan.price > 0 && <span className="text-sm font-normal text-slate-500">/ay</span>}</div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4 flex-1">
                                                            <div className="space-y-1 text-sm text-slate-600">
                                                                <div className="flex justify-between"><span>Kul:</span> <strong>{plan.maxUsers === 0 ? '∞' : plan.maxUsers}</strong></div>
                                                                <div className="flex justify-between"><span>Ürün:</span> <strong>{plan.maxProducts === 0 ? '∞' : plan.maxProducts}</strong></div>
                                                            </div>
                                                            <div className="pt-2 border-t text-xs text-slate-500 h-20 overflow-hidden">
                                                                {plan.features.map((f: string, i: number) => <div key={i} className="flex items-center gap-1"><Check size={10} className="text-green-500" /> {f}</div>)}
                                                            </div>
                                                        </CardContent>
                                                        <div className="p-4 border-t flex gap-2">
                                                            <Button variant="outline" className="w-full" onClick={() => openPlanDialog(plan)}><Edit2 className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" className="w-fit text-red-500" onClick={() => handleDeletePlan(plan.id)}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </Card>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </TabsContent>

                {/* --- 3. SEKME: TALEPLER --- */}
                <TabsContent value="requests" className="mt-4">
                    <Card className="shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Durum</TableHead><TableHead>Şirket/Kişi</TableHead><TableHead>İletişim</TableHead><TableHead>Mesaj</TableHead><TableHead className="text-right">Tarih</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader><TableBody>{requests.map((r: any) => (<TableRow key={r.id} className={r.status === 'PENDING' ? 'bg-blue-50/50' : ''}>
                        <TableCell><Badge variant={r.status === 'PENDING' ? 'secondary' : (r.status === 'CLOSED' ? 'outline' : 'default')}>{r.status}</Badge></TableCell>
                        <TableCell><div className="font-medium">{r.companyName}</div><div className="text-xs text-slate-500">{r.fullName}</div></TableCell>
                        <TableCell><div className="flex flex-col text-xs gap-1"><span><Mail size={10} className="inline" /> {r.email}</span><span><Phone size={10} className="inline" /> {r.phone}</span></div></TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-slate-600" title={r.message}>{r.message}</TableCell>
                        <TableCell className="text-right text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleRequestStatus(r.id, 'CONTACTED')}><CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Görüşüldü</DropdownMenuItem><DropdownMenuItem onClick={() => handleRequestStatus(r.id, 'CLOSED')}><Ban className="mr-2 h-4 w-4 text-slate-400" /> Kapat</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                    </TableRow>))}</TableBody></Table></CardContent></Card>
                </TabsContent>
            </Tabs>

            {/* --- DİNAMİK PAKET DÜZENLEME DIALOG --- */}
            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{selectedPlan ? 'Paketi Düzenle' : 'Yeni Paket Ekle'}</DialogTitle></DialogHeader>
                    <form onSubmit={handlePlanSave} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Paket Adı</Label><Input required value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} /></div><div className="space-y-2"><Label>Kod</Label><Input required disabled={!!selectedPlan} value={planForm.code} onChange={e => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })} /></div></div>
                        <div className="bg-slate-50 p-4 rounded border space-y-3">
                            <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4" checked={planForm.isActive} onChange={e => setPlanForm({ ...planForm, isActive: e.target.checked })} /><Label className={planForm.isActive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>Paket Yayında (Aktif)</Label></div>
                            <div className="h-px bg-slate-200 my-2" />
                            <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4" checked={planForm.isFree} onChange={e => setPlanForm({ ...planForm, isFree: e.target.checked, isContact: false, price: 0 })} /><Label>Ücretsiz</Label></div>
                            <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4" checked={planForm.isContact} onChange={e => setPlanForm({ ...planForm, isContact: e.target.checked, isFree: false, price: 0 })} /><Label>Teklif Al (Enterprise)</Label></div>
                            {!planForm.isFree && !planForm.isContact && (<div className="pt-2"><Label>Fiyat (₺)</Label><Input type="number" min="0" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })} /></div>)}
                        </div>
                        <div className="grid grid-cols-3 gap-2"><div className="space-y-1"><Label className="text-xs">Max Kul.</Label><Input type="number" disabled={planForm.isContact} value={planForm.maxUsers} onChange={e => setPlanForm({ ...planForm, maxUsers: Number(e.target.value) })} /></div><div className="space-y-1"><Label className="text-xs">Max Ürün</Label><Input type="number" disabled={planForm.isContact} value={planForm.maxProducts} onChange={e => setPlanForm({ ...planForm, maxProducts: Number(e.target.value) })} /></div><div className="space-y-1"><Label className="text-xs">Max Depo</Label><Input type="number" disabled={planForm.isContact} value={planForm.maxWarehouses} onChange={e => setPlanForm({ ...planForm, maxWarehouses: Number(e.target.value) })} /></div></div>
                        <div className="space-y-2"><Label>Özellikler</Label><Textarea className="h-32" value={planForm.features} onChange={e => setPlanForm({ ...planForm, features: e.target.value })} /></div>
                        <div className="flex items-center gap-2 pt-2"><input type="checkbox" className="w-4 h-4" checked={planForm.isPopular} onChange={e => setPlanForm({ ...planForm, isPopular: e.target.checked })} /><Label className="text-blue-600 font-bold">Popüler Yap</Label></div>
                        <Button type="submit" className="w-full bg-slate-900" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : 'Kaydet'}</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- DETAYLI ŞİRKET DÜZENLEME (SHEET) --- */}
            <Sheet open={isTenantSheetOpen} onOpenChange={setIsTenantSheetOpen}>
                <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                    <SheetHeader className="mb-6"><SheetTitle>Şirket Yönetimi: {selectedTenant?.name}</SheetTitle><SheetDescription>Müşteri bilgilerini ve abonelik durumunu buradan yönetebilirsiniz.</SheetDescription></SheetHeader>
                    {selectedTenant && (
                        <form onSubmit={handleTenantUpdate} className="space-y-6">
                            <Tabs defaultValue="general">
                                <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="general">Genel</TabsTrigger><TabsTrigger value="contact">İletişim</TabsTrigger><TabsTrigger value="plan">Plan</TabsTrigger></TabsList>
                                <TabsContent value="general" className="space-y-4 mt-4">
                                    <div className="space-y-2"><Label>Şirket Adı</Label><Input value={selectedTenant.name} onChange={(e) => setSelectedTenant({ ...selectedTenant, name: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Subdomain</Label><Input disabled value={selectedTenant.subdomain} className="bg-slate-100" /></div>
                                    <div className="space-y-2"><Label>Website</Label><Input placeholder="www.sirket.com" value={selectedTenant.website} onChange={(e) => setSelectedTenant({ ...selectedTenant, website: e.target.value })} /></div>
                                </TabsContent>
                                <TabsContent value="contact" className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Yetkili</Label><Input value={selectedTenant.contactName} onChange={(e) => setSelectedTenant({ ...selectedTenant, contactName: e.target.value })} /></div><div className="space-y-2"><Label>Telefon</Label><Input value={selectedTenant.phone} onChange={(e) => setSelectedTenant({ ...selectedTenant, phone: e.target.value })} /></div></div>
                                    <div className="space-y-2"><Label>Adres</Label><Textarea value={selectedTenant.address} onChange={(e) => setSelectedTenant({ ...selectedTenant, address: e.target.value })} /></div>
                                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Vergi Dairesi</Label><Input value={selectedTenant.taxOffice} onChange={(e) => setSelectedTenant({ ...selectedTenant, taxOffice: e.target.value })} /></div><div className="space-y-2"><Label>Vergi No</Label><Input value={selectedTenant.taxNo} onChange={(e) => setSelectedTenant({ ...selectedTenant, taxNo: e.target.value })} /></div></div>
                                </TabsContent>
                                <TabsContent value="plan" className="space-y-4 mt-4">
                                    <div className="space-y-2"><Label>Paket</Label><Select value={selectedTenant.planId} onValueChange={(val) => setSelectedTenant({ ...selectedTenant, planId: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.price}₺)</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-2 bg-slate-50 p-4 rounded border"><Label>Hesap Durumu</Label><Select value={selectedTenant.isActive ? "active" : "passive"} onValueChange={(val) => setSelectedTenant({ ...selectedTenant, isActive: val === "active" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="passive">Pasif</SelectItem></SelectContent></Select></div>
                                </TabsContent>
                            </Tabs>
                            <div className="pt-4 border-t"><Button type="submit" className="w-full bg-slate-900 h-11" disabled={saving}>{saving ? <Loader2 className="animate-spin mr-2" /> : 'Kaydet'}</Button></div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}