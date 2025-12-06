import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface UseDataFetchOptions {
    enabled?: boolean;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
}

export function useDataFetch<T = any>(
    url: string | null,
    deps: any[] = [],
    options: UseDataFetchOptions = {}
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { enabled = true, onSuccess, onError } = options;

    useEffect(() => {
        if (!url || !enabled) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await api.get(url);
                setData(response.data);
                onSuccess?.(response.data);
            } catch (err) {
                const error = err as Error;
                setError(error);
                onError?.(error);
                console.error('Data fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, enabled, ...deps]);

    const refetch = async () => {
        if (!url) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(url);
            setData(response.data);
            onSuccess?.(response.data);
            return response.data;
        } catch (err) {
            const error = err as Error;
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        loading,
        error,
        refetch,
        setData
    };
}

// Multiple endpoints için helper
export function useMultipleDataFetch(
    urls: Array<{ key: string; url: string }>,
    deps: any[] = []
) {
    const [data, setData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError(null);

            try {
                const responses = await Promise.all(
                    urls.map(({ url }) => api.get(url))
                );

                const result: Record<string, any> = {};
                urls.forEach(({ key }, index) => {
                    result[key] = responses[index].data;
                });

                setData(result);
            } catch (err) {
                const error = err as Error;
                setError(error);
                console.error('Multiple data fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps]);

    const refetch = async () => {
        setLoading(true);
        setError(null);

        try {
            const responses = await Promise.all(
                urls.map(({ url }) => api.get(url))
            );

            const result: Record<string, any> = {};
            urls.forEach(({ key }, index) => {
                result[key] = responses[index].data;
            });

            setData(result);
            return result;
        } catch (err) {
            const error = err as Error;
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, refetch };
}
