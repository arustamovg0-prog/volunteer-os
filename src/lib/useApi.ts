import useSWR, { SWRConfiguration } from 'swr';
import { getPrivilegedHeaders } from './client-security';

const fetcher = async (url: string) => {
  const res = await fetch(url, { headers: getPrivilegedHeaders() });
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    (error as any).info = await res.json().catch(() => ({}));
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

export function useApi<Data = any, Error = any>(
  url: string | null,
  options?: SWRConfiguration<Data, Error>
) {
  return useSWR<Data, Error>(url, fetcher, {
    // defaults: revalidate on focus is good, but we can set sensible defaults
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    ...options,
  });
}
