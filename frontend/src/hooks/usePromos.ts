import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { Promo } from '@/types';
import { toast } from 'sonner';

export const usePromos = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromos = useCallback(async (includeInactive = true) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<{ success: boolean; data: Promo[]; message?: string }>(`/api/promos?includeInactive=${includeInactive}`);
      if (data.success && data.data) {
        setPromos(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch promos');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPromo = async (promoData: Partial<Promo>) => {
    try {
      const { data } = await api.post<{ success: boolean; data: Promo; message?: string }>('/api/promos', promoData);
      if (data.success && data.data) {
        setPromos(prev => [data.data, ...prev]);
        toast.success('Promo created successfully');
        return true;
      }
      throw new Error(data.message || 'Failed to create promo');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
      return false;
    }
  };

  const updatePromo = async (id: number, promoData: Partial<Promo>) => {
    try {
      const { data } = await api.put<{ success: boolean; data: Promo; message?: string }>(`/api/promos/${id}`, promoData);
      if (data.success && data.data) {
        setPromos(prev => prev.map(p => p.id === id ? data.data : p));
        toast.success('Promo updated successfully');
        return true;
      }
      throw new Error(data.message || 'Failed to update promo');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
      return false;
    }
  };

  const deletePromo = async (id: number, credentials: { email: string; password: string }) => {
    try {
      const { data } = await api.post<{ success: boolean; message?: string }>(`/api/promos/${id}/delete`, credentials);
      if (data.success) {
        setPromos(prev => prev.filter(p => p.id !== id));
        toast.success('Promo deleted successfully');
        return true;
      }
      throw new Error(data.message || 'Failed to delete promo');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
      return false;
    }
  };

  return { promos, loading, error, fetchPromos, createPromo, updatePromo, deletePromo };
};
