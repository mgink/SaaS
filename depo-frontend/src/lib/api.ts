import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000', // Backend adresi
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