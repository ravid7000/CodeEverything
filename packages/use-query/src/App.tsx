import { useState } from "react";
import { useQuery } from "./useQuery";

export function App() {
  const [param, setParam] = useState("1")

  const request = useQuery({
    queryKey: [param],
    queryFn: async () => {
      const response = await getDataFromServer(param);
      return response.data;
    },
  });

  console.log({ request })

  if (request.status === 'loading') {
    return <p>Loading...</p>;
  }

  if (request.status === 'error') {
    return <p>Error: {request.error?.message}</p>;
  }

  return <p>Data: {request.data}</p>;
}
function getDataFromServer(param) {
  return new Promise<{ data: any }>((resolve) => {
    setTimeout(resolve, 100, {
      data: param
    })
  })
}

