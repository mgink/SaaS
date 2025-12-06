'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useMultipleDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GitBranch, Plus, MapPin, Phone, Trash2, Store, User, ShieldCheck, Users, Warehouse, Mail, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomLoader } from '@/components/ui/custom-loader';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EmptyState from '@/components/EmptyState';

export default function BranchesPage() {
    // Fetch all data using custom hook
    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'branches', url: '/branches' },
        { key: 'users', url: '/users' },
        { key: 'warehouses', url: '/settings/warehouses' }
    ]);

    const branches = data.branches || [];
    const users = data.users || [];
    const warehouses = data.warehouses || [];
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Detay Modal State
    const [selectedBranch, setSelectedBranch] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        name: '', location: '', phone: '',
        addManager: false,
        managerName: '', managerEmail: '', managerPhone: '', managerPassword: ''
    });



    // --- YARDIMCI FONKSİYONLAR ---
    const getBranchManager = (branchId: string) => {
        return users.find((u: any) => u.branchId === branchId && u.role === 'BRANCH_MANAGER');
    }

    const getBranchStaff = (branchId: string) => {
        return users.filter((u: any) => u.branchId === branchId && u.role !== 'BRANCH_MANAGER');
    }

    const getBranchWarehouses = (branchId: string) => {
        return warehouses.filter((w: any) => w.branchId === branchId);
    }

    // --- HANDLERS ---
    const handleCreate = async () => {
        if (!formData.name) return;
        try {
            const payload = { ...formData };
            if (!formData.addManager) {
                delete (payload as any).managerName;
                delete (payload as any).managerEmail;
                delete (payload as any).managerPassword;
            }

            await api.post('/branches', payload);
            setFormData({ name: '', location: '', phone: '', addManager: false, managerName: '', managerEmail: '', managerPhone: '', managerPassword: '' });
            setIsCreateOpen(false);
            refetch();
            toast.success("Şube oluşturuldu.");
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Hata oluştu.");
        }
    };

    const handleDelete = async (e: any, id: string) => {
        e.stopPropagation();
        if (!confirm('Şubeyi silmek istediğinize emin misiniz?')) return;
        try { await api.delete(`/branches/${id}`); refetch(); toast.success("Silindi."); }
        catch (e) { toast.error("Silinemedi."); }
    }

    const openDetail = (branch: any) => {
        setSelectedBranch(branch);
        setIsDetailOpen(true);
    }

    // --- STİL ---
    const GLASS_CARD_STYLE = "bg-white/60 backdrop-blur-md border border-white/50 shadow-sm hover:shadow-lg hover:bg-white/80 transition-all cursor-pointer group";

    if (loading) return <AppLayout><div className="flex h-screen items-center justify-center"><CustomLoader size="xl" /></div></AppLayout>;

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Şube Yönetimi</h1>
                    <p className="text-sm text-slate-500">Şubelerinizi, yöneticileri ve personelleri tek ekrandan yönetin.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild><Button className="bg-slate-900 hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> Yeni Şube</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Yeni Şube Ekle</DialogTitle></DialogHeader>
                        <div className="space-y-4 mt-4">
                            {/* Şube Formu (Aynı kaldı) */}
                            <div className="space-y-2"><Label>Şube Adı *</Label><Input placeholder="Örn: Kadıköy Şubesi" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Konum</Label><Input placeholder="Adres..." value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Telefon</Label><Input placeholder="0212..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="addManager" className="w-4 h-4" checked={formData.addManager} onChange={e => setFormData({ ...formData, addManager: e.target.checked })} />
                                    <Label htmlFor="addManager" className="cursor-pointer font-bold text-slate-700">Şube Yöneticisi Ata</Label>
                                </div>
                                {formData.addManager && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 pt-2 border-t border-slate-200">
                                        <div className="space-y-2"><Label>Yönetici Ad Soyad</Label><Input value={formData.managerName} onChange={e => setFormData({ ...formData, managerName: e.target.value })} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label>E-posta</Label><Input type="email" value={formData.managerEmail} onChange={e => setFormData({ ...formData, managerEmail: e.target.value })} /></div>
                                            <div className="space-y-2"><Label>Cep Tel</Label><Input value={formData.managerPhone} onChange={e => setFormData({ ...formData, managerPhone: e.target.value })} /></div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Geçici Şifre</Label>
                                            <Input type="password" placeholder="******" value={formData.managerPassword} onChange={e => setFormData({ ...formData, managerPassword: e.target.value })} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Button onClick={handleCreate} className="w-full bg-slate-900">Oluştur</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {branches.length === 0 ? (
                <EmptyState icon={Store} title="Şube Yok" description="Henüz hiç şube eklenmemiş." actionLabel="+ Şube Ekle" onAction={() => setIsCreateOpen(true)} />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {branches.map((b: any) => {
                        const manager = getBranchManager(b.id);
                        const staffCount = getBranchStaff(b.id).length;
                        const whCount = getBranchWarehouses(b.id).length;

                        return (
                            <Card key={b.id} onClick={() => openDetail(b)} className={`border-l-4 border-l-indigo-500 ${GLASS_CARD_STYLE}`}>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(e, b.id)}><Trash2 size={16} /></Button>
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800"><Store className="text-indigo-500" size={20} /> {b.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-sm text-slate-500 flex items-center gap-2"><MapPin size={14} /> {b.location || 'Konum Yok'}</div>

                                    {/* YÖNETİCİ KARTI (MİNİ) */}
                                    {manager ? (
                                        <div className="bg-indigo-50/50 p-2 rounded-lg flex items-center gap-3 border border-indigo-100">
                                            <Avatar className="h-8 w-8 border border-indigo-200">
                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">{manager.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-xs font-bold text-indigo-900 truncate">{manager.fullName}</p>
                                                <p className="text-[10px] text-indigo-600 truncate">Şube Müdürü</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-400 italic flex items-center gap-1 p-2 bg-slate-50 rounded"><User size={12} /> Yönetici atanmamış</div>
                                    )}

                                    <div className="pt-3 border-t border-slate-100 flex justify-between text-xs font-medium text-slate-500">
                                        <span className="flex items-center gap-1"><Warehouse size={12} /> {whCount} Depo</span>
                                        <span className="flex items-center gap-1"><Users size={12} /> {staffCount} Personel</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* --- ŞUBE DETAY MODALI --- */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-4xl bg-slate-50/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                    {selectedBranch && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg"><Store className="text-indigo-600 h-6 w-6" /></div>
                                    <div>
                                        <DialogTitle className="text-2xl text-slate-900">{selectedBranch.name}</DialogTitle>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {selectedBranch.location}</span>
                                            {selectedBranch.phone && <span className="flex items-center gap-1"><Phone size={12} /> {selectedBranch.phone}</span>}
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <Tabs defaultValue="staff" className="w-full mt-4">
                                <TabsList className="grid w-full grid-cols-3 bg-white/50">
                                    <TabsTrigger value="staff">Personel</TabsTrigger>
                                    <TabsTrigger value="warehouses">Depolar</TabsTrigger>
                                    <TabsTrigger value="info">Genel Bilgi</TabsTrigger>
                                </TabsList>

                                {/* SEKME 1: PERSONEL */}
                                <TabsContent value="staff" className="space-y-4 mt-4">
                                    {/* Yönetici Kartı */}
                                    {getBranchManager(selectedBranch.id) && (
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                                    <AvatarFallback className="bg-indigo-600 text-white font-bold">{getBranchManager(selectedBranch.id).fullName.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-indigo-900 text-lg">{getBranchManager(selectedBranch.id).fullName}</div>
                                                    <div className="text-indigo-600 text-sm flex items-center gap-1"><ShieldCheck size={14} /> Şube Müdürü</div>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-slate-500 space-y-1">
                                                <div className="flex items-center gap-1 justify-end"><Mail size={12} /> {getBranchManager(selectedBranch.id).email}</div>
                                                {getBranchManager(selectedBranch.id).phone && <div className="flex items-center gap-1 justify-end"><Phone size={12} /> {getBranchManager(selectedBranch.id).phone}</div>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Personel Listesi */}
                                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                        <div className="p-3 bg-slate-50 border-b font-medium text-sm text-slate-700 flex justify-between items-center">
                                            <span>Çalışan Listesi</span>
                                            <Badge variant="outline" className="bg-white">{getBranchStaff(selectedBranch.id).length} Kişi</Badge>
                                        </div>
                                        <div className="divide-y">
                                            {getBranchStaff(selectedBranch.id).length === 0 ? (
                                                <div className="p-6 text-center text-sm text-slate-400">Bu şubede henüz personel yok.</div>
                                            ) : (
                                                getBranchStaff(selectedBranch.id).map((s: any) => (
                                                    <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-slate-200 text-slate-600 text-xs">{s.fullName.substring(0, 2)}</AvatarFallback></Avatar>
                                                            <div>
                                                                <div className="font-medium text-sm text-slate-900">{s.fullName}</div>
                                                                <div className="text-xs text-slate-500 flex gap-2">
                                                                    <span>{s.email}</span>
                                                                    {s.tags?.map((t: string) => <span key={t} className="bg-slate-100 px-1 rounded text-slate-600">{t}</span>)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[10px]">{s.role}</Badge>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* SEKME 2: DEPOLAR */}
                                <TabsContent value="warehouses" className="mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getBranchWarehouses(selectedBranch.id).map((w: any) => (
                                            <div key={w.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Warehouse size={16} className="text-blue-500" /> {w.name}</h4>
                                                        <Badge variant="outline" className="bg-slate-50">{w._count?.products || 0} Ürün</Badge>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {w.location || 'Lokasyon belirtilmemiş'}</div>
                                                </div>
                                                <div className="mt-4 pt-3 border-t flex gap-2 flex-wrap">
                                                    {w.departments?.map((d: any) => (
                                                        <span key={d.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">{d.name}</span>
                                                    ))}
                                                    {w.departments?.length === 0 && <span className="text-[10px] text-slate-400 italic">Departman yok</span>}
                                                </div>
                                            </div>
                                        ))}
                                        {getBranchWarehouses(selectedBranch.id).length === 0 && (
                                            <div className="col-span-2 p-8 text-center text-slate-500 bg-white rounded-xl border border-dashed">Bu şubeye bağlı depo bulunamadı.</div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* SEKME 3: GENEL BİLGİ */}
                                <TabsContent value="info" className="mt-4">
                                    <Card>
                                        <CardContent className="p-6 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500">Oluşturulma Tarihi</Label>
                                                    <div className="text-sm font-medium">{new Date(selectedBranch.createdAt).toLocaleDateString('tr-TR')}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500">İletişim</Label>
                                                    <div className="text-sm font-medium">{selectedBranch.phone || '-'}</div>
                                                </div>
                                                <div className="space-y-1 col-span-2">
                                                    <Label className="text-xs text-slate-500">Tam Adres</Label>
                                                    <div className="text-sm font-medium p-2 bg-slate-50 rounded border">{selectedBranch.location || '-'}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}