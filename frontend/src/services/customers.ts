import { api } from './api';
import type { ApiResponse, Customer, CustomerCard, CustomerDetails } from '@/types';

export type CustomerInput = { fullName: string; username: string; email: string; phone?: string; adminNotes?: string };
export type NfcCard = { url: string; issuedAt: string };
export type CreatedCustomer = { customer: Customer; card: NfcCard };
export type CustomerCardRenewal = { customer: Customer; amount: number; validFrom: string; validThrough: string };

type CacheEntry<T> = { expiresAt: number; request: Promise<T> };
const listCache = new Map<string, CacheEntry<Customer[]>>();
const searchCache = new Map<string, CacheEntry<Customer[]>>();
const detailsCache = new Map<number, CacheEntry<CustomerDetails>>();

function cached<T>(cache: Map<any, CacheEntry<T>>, key: any, ttlMs: number, loader: () => Promise<T>) {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.request;
  const request = loader().catch(error => { cache.delete(key); throw error; });
  cache.set(key, { expiresAt: Date.now() + ttlMs, request });
  return request;
}

function invalidateCustomer(id?: number) {
  listCache.clear();
  searchCache.clear();
  if (id !== undefined) detailsCache.delete(id);
  else detailsCache.clear();
}

export const customerService = {
  list: (q = '', includeInactive = true) => cached(listCache, `${includeInactive}:${q.trim().toLowerCase()}`, 30_000, async () => (await api.get<ApiResponse<Customer[]>>('/api/admin/customers', { params: { q, includeInactive } })).data.data),
  search: (q = '') => cached(searchCache, q.trim().toLowerCase(), 15_000, async () => (await api.get<ApiResponse<Customer[]>>('/api/admin/customers/search', { params: { q } })).data.data),
  get: (id: number) => cached(detailsCache, id, 10_000, async () => (await api.get<ApiResponse<CustomerDetails>>(`/api/admin/customers/${id}`)).data.data),
  create: async (input: CustomerInput) => { const result = (await api.post<ApiResponse<CreatedCustomer>>('/api/admin/customers', input)).data.data; invalidateCustomer(); return result; },
  update: async (id: number, input: CustomerInput) => { const result = (await api.put<ApiResponse<Customer>>(`/api/admin/customers/${id}`, input)).data.data; invalidateCustomer(id); return result; },
  setActive: async (id: number, active: boolean) => { const result = (await api.post<ApiResponse<Customer>>(`/api/admin/customers/${id}/${active ? 'activate' : 'deactivate'}`)).data.data; invalidateCustomer(id); return result; },
  renew: async (id: number) => { const result = (await api.post<ApiResponse<CustomerCardRenewal>>(`/api/admin/customers/${id}/renew`)).data.data; invalidateCustomer(id); return result; },
  getCard: async (id: number) => (await api.get<ApiResponse<NfcCard>>(`/api/admin/customers/${id}/nfc`)).data.data,
  delete: async (id: number) => { const result = (await api.delete<ApiResponse<boolean>>(`/api/admin/customers/${id}`)).data.data; invalidateCustomer(id); return result; },
  card: async (username: string, token: string) => (await api.get<ApiResponse<CustomerCard>>(`/api/customer/card/${encodeURIComponent(username)}/${encodeURIComponent(token)}`)).data.data,
};
