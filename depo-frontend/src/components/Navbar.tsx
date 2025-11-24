'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package2, LayoutDashboard, Package, ArrowLeftRight, Users, Settings, LogOut, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
            fetchNotifications();
        }
    }, []);

    const fetchNotifications = async () => {
        try {
            // Backend'de notifications endpointi olmalı (UsersService içinde yazmıştık ama Controller'a eklemeyi unuttuysan ekle)
            // Şimdilik hata vermemesi için try-catch bloğunda.
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (e) {
            console.log("Bildirimler çekilemedi");
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const linkStyle = (path: string) =>
        `flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600 ${pathname === path ? "text-blue-600" : "text-slate-500"}`;

    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : 'US';

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-16 items-center justify-between px-8 max-w-7xl mx-auto">

                {/* SOL: LOGO VE MENÜ */}
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Package2 className="h-5 w-5 text-white" />
                        </div>
                        SaaS<span className="text-blue-600">Depo</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/dashboard" className={linkStyle('/dashboard')}>
                            <LayoutDashboard size={16} /> Özet
                        </Link>
                        <Link href="/products" className={linkStyle('/products')}>
                            <Package size={16} /> Ürünler
                        </Link>
                        <Link href="/transactions" className={linkStyle('/transactions')}>
                            <ArrowLeftRight size={16} /> Hareketler
                        </Link>

                        {/* Sadece ADMIN görebilir */}
                        {user?.role === 'ADMIN' && (
                            <>
                                <Link href="/users" className={linkStyle('/users')}>
                                    <Users size={16} /> Personel
                                </Link>
                                <Link href="/settings" className={linkStyle('/settings')}>
                                    <Settings size={16} /> Ayarlar
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                {/* SAĞ: BİLDİRİMLER VE PROFİL */}
                <div className="flex items-center gap-2">

                    {/* BİLDİRİMLER */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900">
                                <Bell className="h-5 w-5" />
                                {notifications.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full" />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                            <div className="p-3 font-medium border-b text-sm">Bildirimler</div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-500">Okunmamış bildirim yok.</div>
                                ) : (
                                    notifications.map((n, i) => (
                                        <div key={i} className="p-3 border-b hover:bg-slate-50 text-sm text-slate-700">
                                            {n.message}
                                            <div className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* PROFİL */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="cursor-pointer border hover:border-blue-300 transition-all h-9 w-9">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">{getInitials(user?.fullName)}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    <Badge variant="outline" className="w-fit mt-1 text-[10px]">{user?.role}</Badge>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/settings')} disabled={user?.role !== 'ADMIN'}>
                                <Settings className="mr-2 h-4 w-4" /> Firma Ayarları
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" /> Çıkış Yap
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

            </div>
        </header>
    );
}