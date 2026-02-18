/**
 * Parse a date string from API (usually in UTC format) into a Date object
 * This ensures proper timezone handling for dates received from the server
 */
export const parseApiDate = (dateString: string): Date => {
    // If the date string doesn't end with 'Z' and doesn't have timezone info, 
    // assume it's UTC and add 'Z' suffix
    if (dateString && !dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
        return new Date(dateString + 'Z');
    }
    return new Date(dateString);
};

export const formatDate = (dateString: string) => {
        const locale = navigator.language || navigator.languages?.[0] || 'en-US';
        // Use parseApiDate to ensure proper UTC handling
        return parseApiDate(dateString).toLocaleString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
