import { useCallback, useEffect, useRef, useState } from 'react'

type QueryStatus = 'idle' | 'loading' | 'error' | 'success'

export type UseQueryState<TData> = {
  status: QueryStatus
  data: TData | null
  error?: {
    message: string | null
  }
}

export type UseQueryOptions<TData> = {
  queryFn: () => Promise<TData>
  queryKey: readonly unknown[]
}

export function useQuery<TData>({ queryFn, queryKey }: UseQueryOptions<TData>) {
  const [state, setState] = useState<UseQueryState<TData>>({
    status: 'idle',
    data: null,
    error: {
      message: null
    }
  })

  const partialUpdateState = useCallback((nextState: Partial<UseQueryState<TData>>) => {
    setState((prev) => ({ ...prev, ...nextState }))
  }, [])

  const queryFnRef = useRef(queryFn)
  useEffect(() => {
    queryFnRef.current = queryFn
  }, [queryFn])

  useEffect(() => {
    let ignored = false
    partialUpdateState({ status: 'loading', data: null, error: undefined })
    Promise.resolve(queryFnRef.current())
      .then((data) => {
        if (ignored) {
          return
        }
        partialUpdateState({ data, status: 'success', error: undefined })
      })
      .catch((err) => {
        if (ignored) {
          return
        }
        partialUpdateState({
          data: null,
          error: {
            message: err?.message ?? String(err),
          },
          status: 'error'
        })
      })

    return () => {
      ignored = true
    }
  }, [...queryKey, partialUpdateState])

  return state
}