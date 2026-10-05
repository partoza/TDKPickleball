import { api } from './api';
import type { ApiResponse, Customer, CustomerCard, CustomerDetails } from '@/types';

export type CustomerInput = { fullName: string; username: string; email: string; phone?: string; adminNotes?: string };

export const customerService = {
  list: async (q = '', includeInactive = true) => (await api.get<ApiResponse<Customer[]>>('/api/admin/customers', { params: { q, includeInactive } })).data.data,
  search: async (q = '') => (await api.get<ApiResponse<Customer[]>>('/api/admin/customers/search', { params: { q } })).data.data,
  get: async (id: number) => (await api.get<ApiResponse<CustomerDetails>>(`/api/admin/customers/${id}`)).data.data,
  create: async (input: CustomerInput) => (await api.post<ApiResponse<Customer>>('/api/admin/customers', input)).data.data,
  update: async (id: number, input: CustomerInput) => (await api.put<ApiResponse<Customer>>(`/api/admin/customers/${id}`, input)).data.data,
  setActive: async (id: number, active: boolean) => (await api.post<ApiResponse<Customer>>(`/api/admin/customers/${id}/${active ? 'activate' : 'deactivate'}`)).data.data,
  issue: async (id: number, replace = false) => (await api.post<ApiResponse<{ url: string; issuedAt: string }>>(`/api/admin/customers/${id}/nfc/${replace ? 'replace' : 'issue'}`)).data.data,
  card: async (username: string, token: string) => (await api.get<ApiResponse<CustomerCard>>(`/api/customer/card/${encodeURIComponent(username)}/${encodeURIComponent(token)}`)).data.data,
};
