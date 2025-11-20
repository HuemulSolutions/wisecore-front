export const formatDate = (dateString: string) => {
        const locale = navigator.language || navigator.languages?.[0] || 'en-US';
        return new Date(dateString).toLocaleString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
