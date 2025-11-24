import React from 'react';
import { Building2 } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100 space-y-6">
            <h1 className="text-4xl font-extrabold text-slate-900 border-b pb-4 mb-6 flex items-center gap-3">
                <Building2 size={32} className="text-indigo-600" /> Hakkımızda
            </h1>

            <p className="text-lg text-slate-700 leading-relaxed">
                SaaS Depo, 2022 yılında kurulan ve işletmelerin karmaşık stok ve depo yönetim süreçlerini basitleştirmeyi misyon edinmiş bulut tabanlı bir yazılım çözümüdür. Excel tablolarının yarattığı veri karmaşasına son vererek, personel, envanter ve finansal hareketlerinizi tek bir merkezden yönetmenizi sağlıyoruz.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 pt-4">Vizyonumuz</h2>
            <p className="text-slate-600">
                Vizyonumuz, küçük ve orta ölçekli işletmelerin (KOBİ) dahi, büyük holdinglerinki kadar güçlü ve hatasız bir envanter yönetim altyapısına sahip olmasıdır. Yapay zeka destekli uyarılar ve otomatik SKU atama gibi özelliklerimizle, depo yönetimini sezgisel hale getiriyoruz.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 pt-4">Değerlerimiz</h2>
            <ul className="list-disc list-inside text-slate-600 space-y-2 pl-4">
                <li>Şeffaflık ve Dürüstlük</li>
                <li>Kullanıcı Odaklı Tasarım (UX)</li>
                <li>Veri Güvenliği ve Gizliliği</li>
                <li>Sürekli İnovasyon</li>
            </ul>
        </div>
    );
}