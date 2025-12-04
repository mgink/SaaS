'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Menu, Bell, Search, LogOut, Settings,
    LayoutDashboard, Warehouse, Package, ArrowLeftRight,
    Truck, ClipboardList, GitBranch, Users, Crown, Wallet, LifeBuoy, FileStack, AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Header({ user }: { user: any }) {
    const router = useRouter();
    const pathname = usePathname();
    const [notifications, setNotifications] = useState<any[]>([]);

    const getPageTitle = () => {
        if (pathname.includes('dashboard')) return 'Özet Ekranı';
        if (pathname.includes('products')) return 'Ürün Yönetimi';
        if (pathname.includes('transactions')) return 'Stok Hareketleri';
        if (pathname.includes('users')) return 'Personel';
        if (pathname.includes('settings')) return 'Ayarlar';
        if (pathname.includes('super-admin')) return 'Süper Admin';
        if (pathname.includes('profile')) return 'Profilim';
        if (pathname.includes('branches')) return 'Şubeler';
        if (pathname.includes('suppliers')) return 'Tedarikçiler';
        if (pathname.includes('requests')) return 'Talepler';
        if (pathname.includes('finance')) return 'Finans';
        if (pathname.includes('stock-forms')) return 'Stok Fişleri';
        if (pathname.includes('purchase-orders')) return 'Sipariş & Kabul';
        if (pathname.includes('wastage')) return 'Zayi Takibi';
        return 'Panel';
    }

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        try { const res = await api.get('/notifications'); setNotifications(res.data); } catch (e) { }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : 'US';

    // --- MOBİL MENÜ MANTIĞI ---
    const isActive = (path: string) => pathname === path ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50";
    const linkClass = "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm";

    const userRole = user?.role;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isAdmin = userRole === 'ADMIN';
    const isBranchManager = userRole === 'BRANCH_MANAGER';
    const canSeeManagement = isSuperAdmin || isAdmin || isBranchManager;
    const canManageBranches = isSuperAdmin || isAdmin;

    return (
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b border-slate-100 bg-white/70 backdrop-blur-lg px-6 sticky top-0 z-30 shadow-sm">

            {/* MOBİL MENÜ (SHEET) */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden"><Menu className="h-5 w-5" /><span className="sr-only">Menüyü aç</span></Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col w-72 p-0">
                    <div className="p-6 border-b border-slate-100">
                        <div className="text-lg font-bold flex items-center gap-2 text-slate-900">
                            <div className="bg-blue-600 p-1 rounded-md"><Package className="h-4 w-4 text-white" /></div> SaaS Depo
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 px-3">
                        <nav className="grid gap-1 font-medium">
                            {/* OPERASYON */}
                            <div className="pb-4">
                                <p className="px-3 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Operasyon</p>
                                <Link href="/dashboard" className={`${linkClass} ${isActive('/dashboard')}`}><LayoutDashboard className="h-4 w-4" /> Özet Ekranı</Link>
                                <Link href="/warehouses" className={`${linkClass} ${isActive('/warehouses')}`}><Warehouse className="h-4 w-4" /> Depolarım</Link>
                                <Link href="/products" className={`${linkClass} ${isActive('/products')}`}><Package className="h-4 w-4" /> Ürün Yönetimi</Link>
                                <Link href="/transactions" className={`${linkClass} ${isActive('/transactions')}`}><ArrowLeftRight className="h-4 w-4" /> Stok Hareketleri</Link>
                                <Link href="/stock-forms" className={`${linkClass} ${isActive('/stock-forms')}`}><FileStack className="h-4 w-4" /> Toplu İşlem</Link>
                                <Link href="/purchase-orders" className={`${linkClass} ${isActive('/purchase-orders')}`}><Truck className="h-4 w-4" /> Sipariş & Kabul</Link>
                                <Link href="/finance" className={`${linkClass} ${isActive('/finance')}`}><Wallet className="h-4 w-4" /> Finans</Link>
                                <Link href="/suppliers" className={`${linkClass} ${isActive('/suppliers')}`}><Truck className="h-4 w-4" /> Tedarikçiler</Link>
                                <Link href="/requests" className={`${linkClass} ${isActive('/requests')}`}><ClipboardList className="h-4 w-4" /> Talepler</Link>
                                <Link href="/wastage" className={`${linkClass} ${isActive('/wastage')}`}><AlertTriangle className="h-4 w-4" /> Zayi Takibi</Link>
                            </div>

                            {/* YÖNETİM */}
                            {canSeeManagement && (
                                <div className="pb-4">
                                    <p className="px-3 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Yönetim</p>
                                    {canManageBranches && <Link href="/branches" className={`${linkClass} ${isActive('/branches')}`}><GitBranch className="h-4 w-4" /> Şubeler</Link>}
                                    <Link href="/users" className={`${linkClass} ${isActive('/users')}`}><Users className="h-4 w-4" /> Personel</Link>
                                    <Link href="/settings" className={`${linkClass} ${isActive('/settings')}`}><Settings className="h-4 w-4" /> Ayarlar</Link>
                                </div>
                            )}

                            {/* PLATFORM */}
                            {isSuperAdmin && (
                                <div className="pb-4">
                                    <p className="px-3 text-xs font-semibold text-yellow-600 mb-2 uppercase tracking-wider">Platform Sahibi</p>
                                    <Link href="/super-admin" className={`${linkClass} ${isActive('/super-admin')}`}><Crown className="h-4 w-4 text-yellow-500" /> Süper Admin</Link>
                                </div>
                            )}
                        </nav>
                    </div>

                    {/* ALT BİLGİ */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-9 w-9 border">
                                <AvatarFallback className="bg-blue-600 text-white text-xs">{getInitials(user?.fullName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                            <LogOut className="mr-2 h-3 w-3" /> Çıkış Yap
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <div className="w-full flex-1">
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard">Ana Sayfa</Link></BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbPage>{getPageTitle()}</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* SAĞ ÜST MENÜ */}
            <div className="flex items-center gap-3">
                <div className="relative hidden md:block"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Hızlı ara..." className="w-64 bg-white/50 pl-9 rounded-full focus-visible:ring-primary" /></div>

                <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative rounded-full"><Bell className="h-5 w-5 text-muted-foreground" />{notifications.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full border-2 border-white" />}</Button></PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0 shadow-lg"><div className="p-4 font-semibold border-b bg-muted/50">Bildirimler</div><div className="max-h-[300px] overflow-y-auto">{notifications.length === 0 ? <div className="p-4 text-sm text-muted-foreground text-center">Temiz!</div> : notifications.map((n, i) => (<div key={i} className="p-3 border-b text-sm hover:bg-muted/50">{n.message}</div>))}</div></PopoverContent>
                </Popover>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="secondary" size="icon" className="rounded-full ring-2 ring-white ml-1"><Avatar className="h-8 w-8"><AvatarImage src="" /><AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{getInitials(user?.fullName)}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{user?.fullName}</p><p className="text-xs leading-none text-muted-foreground">{user?.email}</p><Badge variant="outline" className="w-fit mt-1 text-[10px]">{user?.role}</Badge></div></DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/profile')}><Settings className="mr-2 h-4 w-4" /> Profilim</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer"><LogOut className="mr-2 h-4 w-4" /> Çıkış Yap</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}