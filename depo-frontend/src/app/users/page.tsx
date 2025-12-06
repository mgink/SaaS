'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useMultipleDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, UserPlus, UserCog, GitBranch, Check, X, ShieldCheck, Briefcase, Edit2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function UsersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Fetch all data using custom hook
    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'users', url: '/users' },
        { key: 'branches', url: '/branches' }
    ]);

    const users = data.users || [];
    const branches = data.branches || [];

    // Formlar
    const [newUser, setNewUser] = useState({
        fullName: '', email: '', phone: '', password: '',
        role: 'STAFF', branchId: '', canCreateProduct: false, autoApprove: false, tags: ''
    });

    const [editUser, setEditUser] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setCurrentUser(user);

            // Eğer Şube Yöneticisi ise, formu otomatik kendi şubesine kilitle
            if (user.role === 'BRANCH_MANAGER') {
                setNewUser(prev => ({ ...prev, branchId: user.branchId }));
            }

            if (!['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'].includes(user.role)) {
                router.push('/dashboard'); return;
            }
        }
    }, [router]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const tagsArray = newUser.tags.split(',').map(t => t.trim()).filter(t => t !== '');

        // Şube Yöneticisi kontrolü (Frontend tarafında da garanti olsun)
        let payload = { ...newUser, tags: tagsArray };
        if (currentUser.role === 'BRANCH_MANAGER') {
            payload.branchId = currentUser.branchId;
        }

        try {
            await api.post('/users', payload);
            setNewUser({ fullName: '', email: '', phone: '', password: '', role: 'STAFF', branchId: currentUser.role === 'BRANCH_MANAGER' ? currentUser.branchId : '', canCreateProduct: false, autoApprove: false, tags: '' });
            refetch();
            toast.success("Personel eklendi.");
        } catch (error) { /* Global error handler */ }
    };

    const openEditModal = (user: any) => {
        setEditUser({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            branchId: user.branchId || 'none',
            canCreateProduct: user.canCreateProduct,
            autoApprove: user.autoApprove,
            tags: user.tags ? user.tags.join(', ') : '',
            password: ''
        });
        setIsEditOpen(true);
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const tagsArray = editUser.tags.split(',').map((t: any) => t.trim()).filter((t: any) => t !== '');
        try {
            await api.patch(`/users/${editUser.id}`, { ...editUser, tags: tagsArray });
            setIsEditOpen(false); refetch(); toast.success("Güncellendi.");
        } catch (e) { /* Global error handler */ } finally { setSaving(false); }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Silinecek. Emin misiniz?')) return;
        try { await api.delete(`/users/${id}`); refetch(); toast.success("Silindi."); } catch (e) { /* Global error handler */ }
    };

    if (!currentUser) return null;
    const isBranchManager = currentUser.role === 'BRANCH_MANAGER';
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

    const UsersTable = ({ data }: { data: any[] }) => (
        <Table>
            <TableHeader><TableRow><TableHead>Kullanıcı</TableHead><TableHead>Şube</TableHead><TableHead>Etiketler</TableHead><TableHead className="text-center">Yetkiler</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader>
            <TableBody>{data.length === 0 ? (<TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500">Personel yok.</TableCell></TableRow>) : (data.map(u => (
                <TableRow key={u.id} className={u.role === 'BRANCH_MANAGER' ? 'bg-indigo-50/30' : ''}>
                    <TableCell><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.role === 'BRANCH_MANAGER' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{u.fullName.substring(0, 2).toUpperCase()}</div><div><div className="font-medium text-slate-900 flex items-center gap-2">{u.fullName} {u.role === 'BRANCH_MANAGER' && <Badge className="bg-indigo-600 text-[10px] px-1 py-0 h-5">Yönetici</Badge>}</div><div className="text-xs text-slate-500">{u.email}</div></div></div></TableCell>
                    <TableCell>{u.branch ? <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1 font-normal"><GitBranch size={12} /> {u.branch.name}</Badge> : <span className="text-xs text-slate-400 italic">Merkez</span>}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{u.tags && u.tags.map((t: string, i: number) => <span key={i} className="text-[10px] bg-slate-100 border px-1.5 rounded text-slate-600">{t}</span>)}</div></TableCell>
                    <TableCell className="text-center"><div className="flex justify-center gap-2">{u.canCreateProduct ? <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-[10px]">Ürün+</Badge> : null}{u.autoApprove ? <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-[10px]">Oto.Onay</Badge> : null}</div></TableCell>
                    <TableCell className="text-right">{u.id !== currentUser.id && (<div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="hover:bg-slate-100" onClick={() => openEditModal(u)}><Edit2 className="h-4 w-4 text-slate-600" /></Button><Button variant="ghost" size="icon" className="hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</TableCell>
                </TableRow>)))}
            </TableBody>
        </Table>
    );

    return (
        <AppLayout>
            <div className="grid gap-8 lg:grid-cols-3">

                {/* SOL: PERSONEL EKLEME FORMU */}
                <Card className="lg:col-span-1 h-fit border-t-4 border-t-blue-600 shadow-sm bg-white/80 backdrop-blur-md">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><UserPlus className="text-blue-600" /> Yeni Personel</CardTitle><CardDescription>Ekibe yeni bir üye davet edin.</CardDescription></CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2"><Label>Ad Soyad</Label><Input required placeholder="Ahmet Yılmaz" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label>E-posta</Label><Input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div><div className="space-y-2"><Label>Telefon</Label><Input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} /></div></div>
                            <div className="space-y-2"><Label>Geçici Şifre</Label><Input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>

                            {/* YETKİLER */}
                            <div className="space-y-2"><Label>Yetki Seviyesi</Label>
                                <Select value={newUser.role} onValueChange={val => setNewUser({ ...newUser, role: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {/* Şube Müdürü Admin oluşturamaz */}
                                        {isAdmin && <SelectItem value="ADMIN">Yönetici</SelectItem>}
                                        {isAdmin && <SelectItem value="BRANCH_MANAGER">Şube Yöneticisi</SelectItem>}
                                        <SelectItem value="STAFF">Depo Sorumlusu</SelectItem>
                                        <SelectItem value="VIEWER">İzleyici</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ŞUBE SEÇİMİ (Sadece Admin görebilir, Şube Müdürü için kilitli) */}
                            <div className="space-y-2"><Label>Bağlı Olduğu Şube</Label>
                                <Select value={newUser.branchId} onValueChange={val => setNewUser({ ...newUser, branchId: val })} disabled={isBranchManager}>
                                    <SelectTrigger><SelectValue placeholder="Merkez" /></SelectTrigger>
                                    <SelectContent>
                                        {isAdmin && <SelectItem value="none">Merkez</SelectItem>}
                                        {branches.map((b: any) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                {isBranchManager && <p className="text-[10px] text-blue-600">* Otomatik olarak şubenize eklenecektir.</p>}
                            </div>

                            <div className="space-y-2"><Label>Etiketler</Label><Input placeholder="Virgülle ayırın..." value={newUser.tags} onChange={e => setNewUser({ ...newUser, tags: e.target.value })} /></div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="flex flex-col items-start border p-2 rounded bg-slate-50"><Label className="text-xs font-bold mb-2">Ürün Ekleme</Label><Switch checked={newUser.canCreateProduct} onCheckedChange={c => setNewUser({ ...newUser, canCreateProduct: c })} /></div>
                                <div className="flex flex-col items-start border p-2 rounded bg-slate-50"><Label className="text-xs font-bold mb-2">Otomatik Onay</Label><Switch checked={newUser.autoApprove} onCheckedChange={c => setNewUser({ ...newUser, autoApprove: c })} /></div>
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 mt-2">Kaydet</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* SAĞ: PERSONEL LİSTESİ */}
                <Card className="lg:col-span-2 shadow-sm bg-white/80 backdrop-blur-md min-h-[600px]">
                    <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><UserCog className="text-slate-600" /> Personel Listesi</CardTitle><Badge variant="outline">{users.length} Kullanıcı</Badge></div></CardHeader>
                    <CardContent>
                        {/* Sadece Adminler sekmeli yapıyı görür, Şube Müdürü direkt listeyi görür */}
                        {isAdmin ? (
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="w-full flex-wrap h-auto justify-start gap-2 bg-transparent p-0 mb-4">
                                    <TabsTrigger value="all" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 border border-transparent data-[state=active]:border-blue-200">Tümü</TabsTrigger>
                                    {branches.map((b: any) => (<TabsTrigger key={b.id} value={b.id} className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 border border-transparent data-[state=active]:border-indigo-200"><GitBranch size={14} className="mr-1" /> {b.name}</TabsTrigger>))}
                                    <TabsTrigger value="center" className="data-[state=active]:bg-slate-200 data-[state=active]:text-slate-800">Merkez</TabsTrigger>
                                </TabsList>
                                <TabsContent value="all"><UsersTable data={users} /></TabsContent>
                                <TabsContent value="center"><div className="mb-2 p-2 bg-slate-50 rounded text-xs text-slate-500 flex items-center gap-2"><Briefcase size={14} /> Merkez personelleri</div><UsersTable data={users.filter((u: any) => !u.branchId)} /></TabsContent>
                                {branches.map((b: any) => (
                                    <TabsContent key={b.id} value={b.id}>
                                        <div className="mb-2 p-3 bg-indigo-50 rounded border border-indigo-100 flex flex-col gap-1"><div className="text-sm font-bold text-indigo-800 flex items-center gap-2"><ShieldCheck size={16} /> Şube Yöneticisi</div><div className="text-xs text-indigo-600">{users.find((u: any) => u.branchId === b.id && u.role === 'BRANCH_MANAGER')?.fullName || 'Atanmamış'}</div></div>
                                        <UsersTable data={users.filter((u: any) => u.branchId === b.id)} />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        ) : (
                            // Şube Müdürü için sade liste (Sadece kendi şubesi)
                            <UsersTable data={users} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* DÜZENLEME MODALI */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Personel Düzenle</DialogTitle></DialogHeader>
                    {editUser && (
                        <form onSubmit={handleUpdate} className="space-y-4 mt-2">
                            <div className="space-y-2"><Label>Ad Soyad</Label><Input value={editUser.fullName} onChange={e => setEditUser({ ...editUser, fullName: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label>E-posta</Label><Input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} /></div><div className="space-y-2"><Label>Telefon</Label><Input value={editUser.phone} onChange={e => setEditUser({ ...editUser, phone: e.target.value })} /></div></div>
                            <div className="space-y-2"><Label>Yeni Şifre (Opsiyonel)</Label><Input type="password" placeholder="Değiştirmek için yazın" value={editUser.password} onChange={e => setEditUser({ ...editUser, password: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2"><Label>Rol</Label><Select value={editUser.role} onValueChange={val => setEditUser({ ...editUser, role: val })} disabled={isBranchManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{isAdmin && <SelectItem value="ADMIN">Yönetici</SelectItem>}{isAdmin && <SelectItem value="BRANCH_MANAGER">Şube Müdürü</SelectItem>}<SelectItem value="STAFF">Personel</SelectItem><SelectItem value="VIEWER">İzleyici</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Şube</Label><Select value={editUser.branchId} onValueChange={val => setEditUser({ ...editUser, branchId: val })} disabled={isBranchManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{isAdmin && <SelectItem value="none">Merkez</SelectItem>}{branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="space-y-2"><Label>Etiketler</Label><Input value={editUser.tags} onChange={e => setEditUser({ ...editUser, tags: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <div className="flex items-center justify-between border p-2 rounded bg-slate-50"><Label>Ürün Ekleme</Label><Switch checked={editUser.canCreateProduct} onCheckedChange={c => setEditUser({ ...editUser, canCreateProduct: c })} /></div>
                                <div className="flex items-center justify-between border p-2 rounded bg-slate-50"><Label>Oto. Onay</Label><Switch checked={editUser.autoApprove} onCheckedChange={c => setEditUser({ ...editUser, autoApprove: c })} /></div>
                            </div>
                            <Button type="submit" className="w-full bg-slate-900" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : 'Güncelle'}</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}