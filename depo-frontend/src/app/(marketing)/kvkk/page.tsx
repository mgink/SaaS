import React from 'react';
import { Lock } from 'lucide-react';

export default function KvkkPage() {
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100 space-y-6">
            <h1 className="text-4xl font-extrabold text-slate-900 border-b pb-4 mb-6 flex items-center gap-3">
                <Lock size={32} className="text-indigo-600" /> KVKK ve Gizlilik Politikası
            </h1>

            <h2 className="text-2xl font-bold text-slate-800 pt-4">1. Kişisel Verilerin İşlenmesi</h2>
            <p className="text-slate-600 leading-relaxed">
                SaaS Depo olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, kullanıcılarımızın kişisel verilerini (ad, e-posta, şirket adı) yalnızca hizmetlerimizi sunmak ve sözleşme gereklerini yerine getirmek amacıyla işlemekteyiz. Verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 pt-4">2. Veri Güvenliği</h2>
            <p className="text-slate-600 leading-relaxed">
                Tüm verileriniz yüksek güvenlik standartlarına sahip sunucularda barındırılmakta ve düzenli olarak yedeklenmektedir. Yetkisiz erişimi engellemek için 256-bit SSL şifreleme ve rol tabanlı erişim kontrolü kullanılmaktadır.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 pt-4">3. Çerez Politikası</h2>
            <p className="text-slate-600 leading-relaxed">
                Sitemizde kullanıcı deneyiminizi iyileştirmek, trafiği analiz etmek ve hizmetlerimizi kişiselleştirmek amacıyla çerezler (cookies) kullanılmaktadır. Tarayıcınızın ayarları üzerinden çerezleri dilediğiniz zaman devre dışı bırakabilirsiniz.
            </p>
        </div>
    );
}