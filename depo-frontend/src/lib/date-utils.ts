export const getQuickDateRange = (type: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH') => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    // Yerel saat dilimi farkını düzeltmek için yardımcı fonksiyon
    const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    switch (type) {
        case 'TODAY':
            // Başlangıç ve Bitiş: Bugün
            return { start: toLocalISO(start), end: toLocalISO(end) };

        case 'YESTERDAY':
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
            return { start: toLocalISO(start), end: toLocalISO(end) };

        case 'THIS_WEEK':
            // Pazartesi'yi bul
            const day = start.getDay() || 7; // Pazar 0 döner, onu 7 yapıyoruz
            if (day !== 1) start.setHours(-24 * (day - 1));

            // Pazar'ı bul (Pazartesi + 6 gün)
            end.setTime(start.getTime());
            end.setDate(start.getDate() + 6);
            return { start: toLocalISO(start), end: toLocalISO(end) };

        case 'THIS_MONTH':
            start.setDate(1); // Ayın 1'i
            // Gelecek ayın 0. günü = Bu ayın son günü
            const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            return { start: toLocalISO(start), end: toLocalISO(lastDay) };
    }
};