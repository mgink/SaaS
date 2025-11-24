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
import { Menu, Bell, Package2, Search, LogOut, Settings } from "lucide-react";
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

    return (
        // YENİ STİL: bg-white/80 ve backdrop-blur-2xl uygulandı
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b border-slate-100 bg-white/80 backdrop-blur-2xl px-6 sticky top-0 z-30 shadow-lg">

            {/* MOBİL MENÜ */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Menüyü aç</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <div className="text-lg font-bold">SaaS Depo</div>
                </SheetContent>
            </Sheet>

            {/* BREADCRUMB */}
            <div className="w-full flex-1">
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild><Link href="/dashboard">Ana Sayfa</Link></BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* SAĞ TARAF */}
            <div className="flex items-center gap-3">
                <div className="relative hidden md:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Hızlı ara..." className="w-64 bg-muted/50 pl-9 rounded-full focus-visible:ring-primary" />
                </div>

                {/* BİLDİRİMLER */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative rounded-full">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            {notifications.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full border-2 border-background" />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0 shadow-lg">
                        <div className="p-4 font-semibold border-b bg-muted/50">Bildirimler</div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? <div className="p-4 text-sm text-muted-foreground text-center">Temiz!</div> : notifications.map((n, i) => (
                                <div key={i} className="p-3 border-b text-sm hover:bg-muted/50">{n.message}</div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* PROFİL */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full ring-2 ring-background ml-1">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{getInitials(user?.fullName)}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                <p className="xs leading-none text-muted-foreground">{user?.email}</p>
                                <Badge variant="outline" className="w-fit mt-1 text-[10px]">{user?.role}</Badge>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/settings')} disabled={user?.role !== 'ADMIN'}>
                            <Settings className="mr-2 h-4 w-4" /> Ayarlar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" /> Çıkış Yap
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}