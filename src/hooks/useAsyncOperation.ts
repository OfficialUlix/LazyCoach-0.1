import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOperationResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useAsyncOperation<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  initialData: T | null = null
): UseAsyncOperationResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const result = await asyncFunction(...args);
        setState(prev => ({ ...prev, data: result, loading: false }));
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred';
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          loading: false 
        }));
        throw error;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}

// Specialized hook for data fetching with retry capability
export function useDataFetching<T>(
  fetchFunction: () => Promise<T>,
  initialData: T | null = null
) {
  const { data, loading, error, execute, reset } = useAsyncOperation(fetchFunction, initialData);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    fetch: execute,
    retry,
    reset,
  };
}