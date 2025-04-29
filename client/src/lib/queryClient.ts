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
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Accept": "application/json"
      },
      credentials: "include",
    };

    if (data !== undefined && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    console.log(`Making ${method} request to ${url}`);
    const res = await fetch(url, options);
    
    // Log response status
    console.log(`Response from ${url}: ${res.status} ${res.statusText}`);
    
    await throwIfResNotOk(res);

    // For Response type, return the response itself
    if (method === "DELETE" || res.status === 204) {
      return {} as T;
    }

    // Check if the response is JSON before trying to parse it
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const responseData = await res.json();
      return responseData;
    } else {
      // Handle non-JSON responses (like HTML)
      const text = await res.text();
      console.warn(`Received non-JSON response from ${url}. Content-Type: ${contentType}`);
      
      // For browser observer endpoints that return HTML instead of JSON,
      // return an empty array or object to prevent parsing errors
      if (url.includes("/api/browser-observer")) {
        if (Array.isArray(null as unknown as T)) {
          return [] as unknown as T;
        } else {
          return {} as T;
        }
      }
      
      // For other endpoints, throw an error
      throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error(`Error in ${method} request to ${url}:`, error);
    throw error;
  }
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

    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Authentication required for ${url}, returning null`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetching when window gains focus
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      retry: 1, // Allow one retry
      refetchOnMount: true, // Refetch on component mount
    },
    mutations: {
      retry: 1, // Allow one retry for mutations as well
    },
  },
});
