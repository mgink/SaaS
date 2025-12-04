import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://depo-backend-892259824764.us-central1.run.app', // Backend adresi
});

// Her istekten önce çalışır (Request Interceptor)
api.interceptors.request.use((config) => {
    // Bu kod sadece tarayıcıda çalışır (Server tarafında hata vermemesi için)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token'); // Token'ı hafızadan al
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // İsteğe ekle
        }
    }
    return config;
});

export default api;