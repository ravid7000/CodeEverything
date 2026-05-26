## use-query

A small React hook for fetching async data with a `queryKey`/`queryFn` API, inspired by libraries like React Query.

### Installation

```bash
pnpm add @code-everything/use-query
```

### Usage

```tsx
import { useQuery } from '@code-everything/use-query'

function App() {
  const [param, setParam] = useState('1')

  const request = useQuery({
    queryKey: ['get-data', param],
    queryFn: async () => {
      const res = await fetch(`/api/data?param=${param}`)
      const json = await res.json()
      return json.data
    },
  })

  if (request.status === 'loading') {
    return <p>Loading...</p>
  }

  if (request.status === 'error') {
    return <p>Error: {request.error?.message}</p>
  }

  return <p>Data: {request.data}</p>
}
```

