import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Makes an API request with proper error handling
 * @param method HTTP method (GET, POST, PATCH, DELETE)
 * @param url API endpoint URL
 * @param data Data to send (for POST, PATCH requests)
 * @returns Promise resolving to response or JSON data
 */
export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  data?: any,
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (data !== undefined && method !== "GET") {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url, options);
  await throwIfResNotOk(res);

  // For Response type, return the response itself
  if (method === "DELETE" || res.status === 204) {
    return {} as T;
  }

  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // In TanStack Query v5, queryKey is always an array
    if (!Array.isArray(queryKey)) {
      throw new Error(
        'As of v4, queryKey needs to be an Array. If you are using a string like "repoData", please change it to an Array, e.g. ["repoData"]',
      );
    }

    // Use the first element of the array as the URL
    const url = queryKey[0] as string;
    // Any additional parameters can be in the rest of the array

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
