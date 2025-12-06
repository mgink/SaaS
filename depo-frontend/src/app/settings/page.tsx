'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useMultipleDataFetch } from '@/hooks/useDataFetch';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Building, Users } from 'lucide-react';
import { toast } from "sonner";

export default function SettingsPage() {
    const [newWarehouse, setNewWarehouse] = useState('');
    const [newDept, setNewDept] = useState('');

    const { data, loading, refetch } = useMultipleDataFetch([
        { key: 'warehouses', url: '/settings/warehouses' },
        { key: 'departments', url: '/settings/departments' }
    ]);

    const warehouses = data.warehouses || [];
    const departments = data.departments || [];

    const addWarehouse = async () => {
        if (!newWarehouse) return;
        try {
            await api.post('/settings/warehouses', { name: newWarehouse });
            setNewWarehouse('');
            refetch();
            toast.success("Depo eklendi."); // <--- Toast
        } catch (e) { /* Global error handler */ }
    };

    const addDept = async () => {
        if (!newDept) return;
        try {
            await api.post('/settings/departments', { name: newDept });
            setNewDept('');
            refetch();
            toast.success("Departman eklendi."); // <--- Toast
        } catch (e) { /* Global error handler */ }
    };

    return (
        <AppLayout>
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                <Card className="shadow-sm border-t-4 border-t-slate-600">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Building /> Depo Tanımları</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2"><Input placeholder="Yeni Depo Adı" value={newWarehouse} onChange={e => setNewWarehouse(e.target.value)} /><Button onClick={addWarehouse}><Plus size={16} /></Button></div>
                        <div className="space-y-2">{warehouses.map((w: any) => (<div key={w.id} className="p-3 bg-slate-50 rounded flex justify-between items-center"><span>{w.name}</span><Trash2 size={16} className="text-slate-400 cursor-not-allowed" /></div>))}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-t-4 border-t-slate-600">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Departmanlar</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2"><Input placeholder="Yeni Departman" value={newDept} onChange={e => setNewDept(e.target.value)} /><Button onClick={addDept}><Plus size={16} /></Button></div>
                        <div className="space-y-2">{departments.map((d: any) => (<div key={d.id} className="p-3 bg-slate-50 rounded flex justify-between items-center"><span>{d.name}</span><Trash2 size={16} className="text-slate-400 cursor-not-allowed" /></div>))}</div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}