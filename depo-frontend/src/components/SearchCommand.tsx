'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { LayoutDashboard, Package, ArrowLeftRight, Users, Settings, User, LogOut, Crown } from 'lucide-react';

export function SearchCommand() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Bir komut yazın veya arayın..." />
            <CommandList>
                <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>

                <CommandGroup heading="Sayfalar">
                    <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" /> Özet Ekranı
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/products'))}>
                        <Package className="mr-2 h-4 w-4" /> Ürün Yönetimi
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/transactions'))}>
                        <ArrowLeftRight className="mr-2 h-4 w-4" /> Stok Hareketleri
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Yönetim">
                    <CommandItem onSelect={() => runCommand(() => router.push('/users'))}>
                        <Users className="mr-2 h-4 w-4" /> Personel
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                        <Settings className="mr-2 h-4 w-4" /> Ayarlar
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/super-admin'))}>
                        <Crown className="mr-2 h-4 w-4 text-yellow-500" /> Süper Admin
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Hesap">
                    <CommandItem onSelect={() => runCommand(() => router.push('/profile'))}>
                        <User className="mr-2 h-4 w-4" /> Profilim
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        router.push('/');
                    })}>
                        <LogOut className="mr-2 h-4 w-4 text-red-500" /> Çıkış Yap
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}