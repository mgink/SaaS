import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://depo-backend-892259824764.us-central1.run.app',
});

// Request Interceptor - Token ekle
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response Interceptor - Global Error Handler
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window === 'undefined') return Promise.reject(error);

        const status = error.response?.status;
        const message = error.response?.data?.message || 'Bir hata oluştu';

        // 401 - Yetkisiz (Token geçersiz/süresi dolmuş)
        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // 403 - Yasak (Yetki yetersiz)
        if (status === 403) {
            toast.error('Bu işlem için yetkiniz yok.');
            return Promise.reject(error);
        }

        // 404 - Bulunamadı
        if (status === 404) {
            toast.error('İstenen kaynak bulunamadı.');
            return Promise.reject(error);
        }

        // 409 - Çakışma (Duplicate veri)
        if (status === 409) {
            toast.error(message || 'Bu kayıt zaten mevcut.');
            return Promise.reject(error);
        }

        // 422 - Validation hatası
        if (status === 422) {
            toast.error(message || 'Girdiğiniz bilgileri kontrol edin.');
            return Promise.reject(error);
        }

        // 500 - Sunucu hatası
        if (status === 500) {
            toast.error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
            return Promise.reject(error);
        }

        // Network hatası (internet yok)
        if (!error.response) {
            toast.error('İnternet bağlantısı yok. Lütfen kontrol edin.');
            return Promise.reject(error);
        }

        // Diğer hatalar
        toast.error(message);
        return Promise.reject(error);
    }
);

export default api;