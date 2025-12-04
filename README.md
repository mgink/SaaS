<div align="center">

📦 SaaS Depot ERP

Next-Gen Inventory & Operations Management System

Yeni Nesil Stok ve Operasyon Yönetim Sistemi

English | Türkçe

</div>

<a name="english"></a>

🇬🇧 English

SaaS Depot is a modern, multi-branch ERP system designed specifically for cafe and restaurant chains. It features a stunning "Liquid Glass" UI, financial tracking, advanced procurement cycles, and a mobile-first (PWA) approach to manage operations seamlessly.

✨ Key Features

This project goes beyond classic warehouse software to offer comprehensive business management:

🏢 Multi-Branch & RBAC

Multi-Tenant Architecture: Manage multiple companies in isolation within a single installation.

Branch Management: Unlimited hierarchy of branches, warehouses, and departments.

Advanced Authorization: Super Admin, Branch Manager, and Staff roles. Branch managers only see their own data.

📦 Smart Inventory & Operations

Unit Conversion: Smart tracking for Box vs. Piece units. Automatic conversion during transactions.

Stock Forms (Bulk Actions): Create inbound/outbound forms with multiple items (like invoices) for mass transaction management.

Barcode Integration: Fast product finding and adding via mobile camera or handheld terminals.

Wastage Tracking: Dedicated module for tracking broken/spoiled items and calculating financial loss.

💰 Finance & Supply Chain

Supplier Management: Comprehensive supplier profiles, transaction history, and debt tracking.

Procurement Cycle:

Staff creates Request.

Manager approves.

Purchase Order is created.

Inbound Transaction updates stock automatically upon receiving goods.

Cash Flow Analysis: Dashboard widgets for total value, overdue payments, and upcoming expenses.

🎨 UI/UX & Mobile Experience

Ultra Premium Liquid Glass Design: A visually stunning interface with frosted glass effects, ambient backgrounds, and smooth spring animations.

PWA (Progressive Web App): Works like a native app on iOS and Android with custom installation prompts.

Responsive Grid: A dashboard that adapts perfectly to desktop, tablet, and mobile screens.

🛠 Tech Stack

Area

Technology

Frontend

Next.js 14 (App Router), React, TypeScript

UI Kit

Tailwind CSS, Shadcn/UI, Lucide Icons, Framer Motion

Charts

Recharts

Backend

NestJS, TypeScript

Database & ORM

PostgreSQL, Prisma ORM

Auth

JWT (JSON Web Token)

Deployment

Google Cloud Run (Dockerized)

<a name="türkçe"></a>

🇹🇷 Türkçe

SaaS Depo, özellikle kafe ve restoran zincirleri için tasarlanmış, Ultra Premium Liquid Glass arayüz tasarımına sahip, çok şubeli, finansal takip özellikli ve mobil uyumlu (PWA) modern bir ERP sistemidir.

✨ Öne Çıkan Özellikler

Bu proje, klasik depo yazılımlarının ötesine geçerek tam kapsamlı bir işletme yönetimi sunar:

🏢 Çoklu Şube ve Yetki Yönetimi (RBAC)

Multi-Tenant Mimarisi: Tek kurulumda birden fazla şirketi izole şekilde yönetebilme.

Şube Yönetimi: Sınırsız şube, depo ve departman hiyerarşisi.

Gelişmiş Yetkilendirme: Süper Admin, Şube Müdürü ve Personel rolleri. Şube müdürleri sadece kendi şubelerini ve personellerini yönetebilir.

📦 Akıllı Stok ve Operasyon

Birim Yönetimi: Koli (Box) ve Adet (Piece) bazlı giriş/çıkış. Sistem otomatik dönüşüm yapar.

Stok Fişleri (Toplu İşlem): Tek seferde onlarca ürünü içeren İrsaliye/Fatura mantığında giriş ve çıkış fişleri oluşturma.

Barkod Entegrasyonu: Mobil kamera veya el terminali ile hızlı ürün bulma ve ekleme.

Zayi (Fire) Takibi: Kırılan/bozulan ürünlerin kaydı ve maliyet analizi.

💰 Finans ve Tedarik Zinciri

Tedarikçi Yönetimi: Tedarikçi bakiyeleri, geçmiş işlem dökümleri ve "Vadesi Geçen Borçlar" uyarısı.

Satın Alma Döngüsü:

Personel Talep Açar (Request)

Yönetici Onaylar (Approval)

Sipariş Verilir (Purchase Order)

Mal Kabul Yapılır (Inbound Transaction) ile otomatik stok artışı sağlanır.

Nakit Akışı: Vadesi gelen ödemeler, gecikmiş borçlar ve tedarikçi bazlı harcama analizleri.

🎨 UI/UX ve Mobil Deneyim

Liquid Glass Tasarım: Modern, buzlu cam efektli, ambient arka planlı ve yumuşak geçişli animasyonlar.

PWA (Progressive Web App): iOS ve Android cihazlarda uygulama gibi çalışır. iOS için özel "Ana Ekrana Ekle" yönlendirmesi içerir.

Responsive Grid: Masaüstü, tablet ve mobilde kusursuz çalışan, veri odaklı dashboard.

🚀 Kurulum ve Çalıştırma

Ön Gereksinimler

Node.js (v18+)

PostgreSQL Veritabanı (Yerel veya Neon.tech gibi bulut tabanlı)

1. Repoyu İndirin

git clone [https://github.com/kullaniciadiniz/saas-depo-erp.git](https://github.com/kullaniciadiniz/saas-depo-erp.git)
cd saas-depo-erp


2. Bağımlılıkları Yükleyin

# Backend
cd depo-saas-backend
npm install

# Frontend
cd ../depo-frontend
npm install


3. Ortam Değişkenleri (.env)

depo-saas-backend klasöründe .env dosyası oluşturun:

DATABASE_URL="postgresql://user:password@localhost:5432/depodb?schema=public"
JWT_SECRET="guclu_bir_sifre_belirleyin"
PORT=3001


depo-frontend klasöründe .env dosyası oluşturun:

NEXT_PUBLIC_API_URL=http://localhost:3001


4. Veritabanı Hazırlığı

cd depo-saas-backend
npx prisma migrate dev --name init


Demo Verisi Yükleme (Ultra Kaos Modu):
Sistemi 20 şube, 500+ ürün, 20.000+ işlem ve finansal senaryolarla doldurmak için:

npx ts-node prisma/seed-demo.ts


5. Çalıştır

Backend:

npm run start:dev
# http://localhost:3001 adresinde çalışır


Frontend:

npm run dev
# http://localhost:3000 adresinde çalışır


☁️ Dağıtım (Deployment)

Bu proje Google Cloud Run üzerinde çalışacak şekilde optimize edilmiştir.

Canlı Demo: https://depo-frontend-892259824764.us-central1.run.app/

Giriş Bilgileri (Demo)

Admin: admin@urbanbrew.com

Şifre: 123456