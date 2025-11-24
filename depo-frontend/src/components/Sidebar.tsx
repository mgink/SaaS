'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package2, LayoutDashboard, Package, ArrowLeftRight, Users, Settings, LifeBuoy, Crown, Warehouse, ClipboardList, GitBranch, Truck, Wallet } from 'lucide-react';

export default function Sidebar({ userRole }: { userRole: string }) {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50";
    const linkClass = "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm";
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isAdmin = userRole === 'ADMIN';
    const isBranchManager = userRole === 'BRANCH_MANAGER';
    const canSeeManagement = isSuperAdmin || isAdmin || isBranchManager;
    const canManageBranches = isSuperAdmin || isAdmin;

    return (
        <div className="hidden border-r border-slate-100 bg-white/70 backdrop-blur-lg md:block md:w-64 lg:w-72 h-screen fixed left-0 top-0 z-30 overflow-y-auto shadow-sm">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-16 items-center border-b border-slate-100 px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl"><div className="bg-blue-600 p-1.5 rounded-lg"><Package2 className="h-5 w-5 text-white" /></div><span className="text-slate-900">SaaS</span><span className="text-blue-600">Depo</span></Link>
                </div>
                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid items-start px-4 text-sm font-medium lg:px-6 space-y-1">
                        <div className="pb-4">
                            <p className="px-3 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Operasyon</p>
                            <Link href="/dashboard" className={`${linkClass} ${isActive('/dashboard')}`}><LayoutDashboard className="h-4 w-4" /> Özet Ekranı</Link>
                            <Link href="/warehouses" className={`${linkClass} ${isActive('/warehouses')}`}><Warehouse className="h-4 w-4" /> Depolarım</Link>
                            <Link href="/products" className={`${linkClass} ${isActive('/products')}`}><Package className="h-4 w-4" /> Ürün Yönetimi</Link>
                            <Link href="/transactions" className={`${linkClass} ${isActive('/transactions')}`}><ArrowLeftRight className="h-4 w-4" /> Stok Hareketleri</Link>
                            <Link href="/finance" className={`${linkClass} ${isActive('/finance')}`}><Wallet className="h-4 w-4" /> Finans</Link>
                            <Link href="/suppliers" className={`${linkClass} ${isActive('/suppliers')}`}><Truck className="h-4 w-4" /> Tedarikçiler</Link>
                            <Link href="/requests" className={`${linkClass} ${isActive('/requests')}`}><ClipboardList className="h-4 w-4" /> Talepler</Link>
                        </div>
                        {canSeeManagement && (
                            <div className="pb-4">
                                <p className="px-3 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Yönetim</p>
                                {canManageBranches && <Link href="/branches" className={`${linkClass} ${isActive('/branches')}`}><GitBranch className="h-4 w-4" /> Şubeler</Link>}
                                <Link href="/users" className={`${linkClass} ${isActive('/users')}`}><Users className="h-4 w-4" /> Personel</Link>
                                <Link href="/settings" className={`${linkClass} ${isActive('/settings')}`}><Settings className="h-4 w-4" /> Ayarlar</Link>
                            </div>
                        )}
                        {isSuperAdmin && (
                            <div className="pb-4">
                                <p className="px-3 text-xs font-semibold text-yellow-600 mb-2 uppercase tracking-wider">Platform Sahibi</p>
                                <Link href="/super-admin" className={`${linkClass} ${isActive('/super-admin')}`}><Crown className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Süper Admin</Link>
                            </div>
                        )}
                    </nav>
                </div>
                <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-1"><LifeBuoy className="h-4 w-4" /> Destek</div><p className="text-xs text-blue-600/80">v2.6.0 Ultimate</p></div>
                </div>
            </div>
        </div>
    );
}