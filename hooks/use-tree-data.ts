import { useState, useEffect, useCallback } from 'react';
import { TreeData } from '@/lib/services/tree-service';

interface UseTreeDataOptions {
    isOpen: boolean;
}

/**
 * Hook pour gérer les données des arbres depuis Prisma
 */
export function useTreeData({ isOpen }: UseTreeDataOptions) {
    const [trees, setTrees] = useState<TreeData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTrees = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/trees');
            const data = await response.json();

            if (data.success) {
                setTrees(data.trees);
            } else {
                throw new Error(data.error || 'Erreur de chargement');
            }
        } catch (err: any) {
            console.error('Error fetching trees:', err);
            setError(err.message || 'Erreur de chargement');
            setTrees([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchTrees();
        } else {
            setTrees([]);
            setError(null);
        }
    }, [isOpen, fetchTrees]);

    return {
        trees,
        isLoading,
        error,
        refetch: fetchTrees,
    };
}
