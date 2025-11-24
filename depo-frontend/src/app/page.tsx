'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Dialog eklendi
import { Package2, BarChart3, ShieldCheck, Zap, CheckCircle2, Star, ArrowRight, Menu, X, Quote, Globe2, Users2, Activity, Headphones, Database, FileText } from 'lucide-react';

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // POPUP STATE'LERİ
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  // --------------------------------------------------------
  // STATİK İÇERİK MAP'İ (Veritabanı yerine kodu kullanıyoruz)
  // --------------------------------------------------------
  const LEGAL_CONTENT = {
    'about': { title: "Hakkımızda", content: "SaaS Depo, 2022 yılında kurulan ve işletmelerin karmaşık stok ve depo yönetim süreçlerini basitleştirmeyi misyon edinmiş bulut tabanlı bir yazılım çözümüdür. Vizyonumuz, KOBİ'lerin dahi büyük holdinglerinki kadar güçlü bir envanter yönetim altyapısına sahip olmasıdır." },
    'contact': { title: "İletişim", content: "Destek: support@saasdepo.com | Telefon: +90 850 555 0000 | Çalışma Saatleri: Hft İçi 09:00 - 18:00" },
    'privacy': { title: "Gizlilik Politikası", content: "Kişisel verileriniz (e-posta, şirket adı) yalnızca hizmet sunumu amacıyla işlenir. 256-bit SSL şifreleme ve KVKK standartlarına uygunluk esastır. Verileriniz izniniz olmadan üçüncü taraflarla paylaşılmaz." },
    'terms': { title: "Kullanım Şartları", content: "Hizmetlerimiz, abonelik planınıza göre belirlenen limitler dahilinde sunulur. Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal durumunda mevcut ay sonunda aboneliğiniz sona erer." },
    'kvkk': { title: "KVKK", content: "Tüm veri işleme süreçlerimiz 6698 sayılı KVKK'ya ve ilgili mevzuatlara tam uyumludur. Detaylı bilgi için KVKK aydınlatma metnimizi inceleyebilirsiniz." },
  };

  useEffect(() => {
    api.get('/auth/plans')
      .then(res => setPlans(res.data))
      .catch(err => console.error(err));
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  // POPUP AÇMA İŞLEVİ
  const openLegalModal = (slug: keyof typeof LEGAL_CONTENT) => {
    const content = LEGAL_CONTENT[slug];
    if (content) {
      setModalTitle(content.title);
      setModalContent(content.content);
      setIsLegalModalOpen(true);
    }
  };

  const GLASS_CARD_STYLE = 'bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all border border-slate-100';

  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60 shadow-lg">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-600/20"><Package2 size={24} /></div>
            <span className="text-slate-800">SaaS<span className="text-indigo-600">Depo</span></span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Özellikler</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Fiyatlandırma</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">S.S.S.</button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium">Giriş Yap</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:scale-105">Hemen Başla</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b absolute w-full p-4 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-5">
            <button onClick={() => scrollToSection('features')} className="text-left font-medium p-2 hover:bg-slate-50 rounded">Özellikler</button>
            <button onClick={() => scrollToSection('pricing')} className="text-left font-medium p-2 hover:bg-slate-50 rounded">Fiyatlar</button>
            <button onClick={() => scrollToSection('faq')} className="text-left font-medium p-2 hover:bg-slate-50 rounded">S.S.S.</button>
            <div className="h-px bg-slate-100 my-2" />
            <Link href="/login" className="w-full"><Button variant="outline" className="w-full">Giriş Yap</Button></Link>
            <Link href="/register" className="w-full"><Button className="w-full bg-indigo-600">Kayıt Ol</Button></Link>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/30 to-white">
        <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="absolute top-0 left-0 -z-10 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>
        <div className="absolute bottom-0 right-0 -z-10 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply filter"></div>

        <div className="container mx-auto px-6 text-center max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-indigo-600 text-sm font-medium mb-8 animate-in fade-in zoom-in duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Yeni v1.0 Sürümü Yayında
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Deponuzu Yönetmenin <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">En Akıllı Yolu</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Karmaşık Excel dosyalarına veda edin. Stok takibi, personel yönetimi ve finansal raporlar artık tek bir bulut platformunda.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-lg shadow-xl shadow-indigo-600/20 w-full rounded-full transition-all hover:scale-105">
                Ücretsiz Deneyin <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full rounded-full border-slate-300 bg-white/50 hover:bg-white hover:text-slate-900" onClick={() => scrollToSection('features')}>
                Özellikleri Keşfet
              </Button>
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-20 rounded-2xl border-8 border-white/50 shadow-2xl overflow-hidden bg-white max-w-4xl mx-auto rotate-x-12 transform perspective-1000">
            <div className="aspect-[16/9] bg-slate-50 flex items-center justify-center text-slate-400 font-medium relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-slate-50 opacity-50"></div>
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                alt="Dashboard"
                className="w-full h-full object-cover opacity-80 mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- TRUSTED BY, STATS, FEATURES... (AYNI KALDI) --- */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-medium text-slate-500 mb-8 uppercase tracking-widest">500+ İşletme Tarafından Güveniliyor</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-slate-800 rounded-full" /> Acme Corp</span>
            <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-blue-800 rounded-full" /> Global Logistics</span>
            <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-indigo-800 rounded-full" /> TechSolutions</span>
            <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-indigo-800 rounded-full" /> TechSolutions</span>
            <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-emerald-800 rounded-full" /> GreenMarket</span>
            <span className="text-xl font-bold text-slate-800 flex items-center gap-2"><div className="w-6 h-6 bg-purple-800 rounded-full" /> NovaSoft</span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center text-indigo-600 mb-2"><Database size={32} /></div>
              <div className="text-4xl font-extrabold text-slate-900">1M+</div>
              <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Ürün Takibi</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center text-indigo-600 mb-2"><Users2 size={32} /></div>
              <div className="text-4xl font-extrabold text-slate-900">5k+</div>
              <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Mutlu Kullanıcı</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center text-indigo-600 mb-2"><Globe2 size={32} /></div>
              <div className="text-4xl font-extrabold text-slate-900">12</div>
              <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Ülkede Aktif</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center text-indigo-600 mb-2"><Activity size={32} /></div>
              <div className="text-4xl font-extrabold text-slate-900">%99.9</div>
              <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">Uptime Garantisi</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">İşinizi Büyüten Özellikler</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Sadece stok takibi değil, tam kapsamlı bir işletme yönetim sistemi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className={GLASS_CARD_STYLE + ' group'}>
              <CardHeader>
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 size={28} />
                </div>
                <CardTitle className="text-xl">Detaylı Raporlama</CardTitle>
                <CardDescription className="text-base mt-2 leading-relaxed">
                  Günlük, haftalık ve aylık satış grafiklerini inceleyin. Hangi ürünün ne kadar kazandırdığını anında görün.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className={GLASS_CARD_STYLE + ' group'}>
              <CardHeader>
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={28} />
                </div>
                <CardTitle className="text-xl">Gelişmiş Yetkilendirme</CardTitle>
                <CardDescription className="text-base mt-2 leading-relaxed">
                  Personelinize özel roller atayın. Kimin neyi görebileceğini, silebileceğini veya düzenleyebileceğini siz yönetin.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className={GLASS_CARD_STYLE + ' group'}>
              <CardHeader>
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <Zap size={28} />
                </div>
                <CardTitle className="text-xl">Hızlı ve Bulut Tabanlı</CardTitle>
                <CardDescription className="text-base mt-2 leading-relaxed">
                  Kurulum gerektirmez. Tablet, telefon veya bilgisayardan deponuzu 7/24 yönetin. Verileriniz her zaman güvende.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 px-6 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Şeffaf Fiyatlandırma</h2>
            <p className="text-slate-500 text-lg">Gizli ücret yok. İhtiyacınız olan paketi seçin, istediğiniz zaman iptal edin.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 ${plan.isPopular ? 'border-indigo-600 shadow-2xl shadow-indigo-100 scale-105 z-10' : GLASS_CARD_STYLE}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 text-xs font-bold rounded-full uppercase tracking-wide shadow-lg">
                    En Popüler
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {plan.price === 0 ? 'Ücretsiz' : `${plan.price}₺`}
                    </span>
                    {plan.price > 0 && <span className="text-slate-500 font-medium">/ay</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4 text-sm text-slate-600">
                    <li className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-green-100 text-green-600"><CheckCircle2 size={14} /></div>
                      <span><strong>{plan.maxUsers === 0 ? 'Sınırsız' : plan.maxUsers}</strong> Kullanıcı</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-green-100 text-green-600"><CheckCircle2 size={14} /></div>
                      <span><strong>{plan.maxProducts === 0 ? 'Sınırsız' : plan.maxProducts}</strong> Ürün</span>
                    </li>
                    {plan.features.map((feat: string, i: number) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="p-1 rounded-full bg-indigo-50 text-indigo-600"><CheckCircle2 size={14} /></div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={`/register`} className="w-full">
                    <Button className={`w-full h-11 font-medium ${plan.isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-900 hover:bg-slate-800'
                      }`}>
                      {plan.price === 0 ? 'Ücretsiz Başla' : 'Seç ve Başla'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-900">Aklınıza Takılanlar</h2>
          <Accordion type="single" collapsible className="w-full">
            <Card className={GLASS_CARD_STYLE + ' border-none'}>
              <CardContent className="p-0">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-medium text-slate-700">Kurulum için teknik bilgi gerekiyor mu?</AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed">Hayır, SaaS Depo tamamen bulut tabanlıdır. Herhangi bir sunucu kurmanıza gerek yoktur. Hesabınızı oluşturup hemen kullanmaya başlayabilirsiniz.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-medium text-slate-700">İstediğim zaman paketi değiştirebilir miyim?</AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed">Kesinlikle. İş hacminiz büyüdükçe veya küçüldükçe panelinizden anında paket geçişi yapabilirsiniz.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-medium text-slate-700">Verilerim güvende mi?</AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed">Evet, tüm verileriniz 256-bit SSL şifreleme ile korunmakta ve günlük olarak yedeklenmektedir.</AccordionContent>
                </AccordionItem>
              </CardContent>
            </Card>
          </Accordion>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section id="testimonials" className="py-24 px-6 bg-slate-50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-slate-900">Mutlu Müşteriler</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className={GLASS_CARD_STYLE + ' p-8 relative'}>
              <Quote className="absolute top-6 right-6 text-slate-200 h-12 w-12 rotate-180" />
              <div className="flex gap-1 text-amber-400 mb-6"><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /></div>
              <p className="text-slate-700 mb-8 text-lg italic leading-relaxed">"Stok sayımı yaparken kaybettiğimiz zamanı %80 azalttık. Özellikle mobil uyumlu olması saha ekibimiz için harika oldu. Kesinlikle tavsiye ediyorum."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-lg">AH</div>
                <div>
                  <div className="font-bold text-slate-900">Ahmet Hakan</div>
                  <div className="text-sm text-slate-500">Operasyon Müdürü, Lojistik A.Ş.</div>
                </div>
              </div>
            </Card>
            <Card className={GLASS_CARD_STYLE + ' p-8 relative'}>
              <Quote className="absolute top-6 right-6 text-slate-200 h-12 w-12 rotate-180" />
              <div className="flex gap-1 text-amber-400 mb-6"><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /></div>
              <p className="text-slate-700 mb-8 text-lg italic leading-relaxed">"Excel dosyalarında kaybolmaktan bıkmıştık. SaaS Depo ile her şey düzenli, yetkilendirme sistemi sayesinde verilerimiz artık güvende."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700 text-lg">ZE</div>
                <div>
                  <div className="font-bold text-slate-900">Zeynep Erdem</div>
                  <div className="text-sm text-slate-500">Kurucu, Moda Butik</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-indigo-600 rounded-3xl p-8 md:p-16 text-center text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Deponuzu Yönetmeye Hazır mısınız?</h2>
            <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">
              14 gün boyunca kredi kartı gerekmeden tüm özellikleri ücretsiz deneyin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/register">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 h-14 px-8 text-lg font-bold shadow-lg transition-transform hover:scale-105">
                  Hemen Başla
                </Button>
              </Link>
              <Link href="#">
                <Button size="lg" variant="outline" className="border-indigo-400 text-white hover:bg-indigo-700 h-14 px-8 text-lg">
                  Satış Ekibiyle Görüş
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER (DARK) --- */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 font-bold text-2xl text-white mb-6">
                <div className="bg-indigo-600 p-1.5 rounded"><Package2 size={20} /></div>
                SaaS Depo
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">Modern işletmeler için bulut tabanlı, güvenli ve hızlı stok yönetim çözümü. İşinizi dijitalleştirin.</p>
              <div className="mt-6 flex gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"><Globe2 size={18} /></div>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"><Headphones size={18} /></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Ürün</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Özellikler</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Fiyatlar</button></li>
                <li><Link href="#" className="hover:text-white transition-colors">Geliştirici API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Kurumsal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">Hakkımızda</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">İletişim</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2025 SaaS Depo A.Ş. Tüm hakları saklıdır.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-white transition-colors">Kullanım Şartları</Link>
              <Link href="/kvkk" className="hover:text-white transition-colors">KVKK</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}