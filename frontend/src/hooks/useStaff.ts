import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { StaffProfile, StaffType } from '@/types';
import { toast } from 'sonner';

export function useStaff() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStaff = useCallback(async (type?: StaffType) => {
    try {
      setLoading(true);
      const url = type !== undefined ? `/api/staff?type=${type}` : '/api/staff';
      const response = await api.get<{ data: StaffProfile[] }>(url);
      setStaff(response.data.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast.error('Failed to load staff profiles');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStaff = async (data: Omit<StaffProfile, 'id' | 'isActive'>) => {
    try {
      await api.post('/api/staff', data);
      toast.success('Staff profile created');
      await fetchStaff();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create staff profile');
      return false;
    }
  };

  const updateStaff = async (id: number, data: Omit<StaffProfile, 'id'>) => {
    try {
      await api.put(`/api/staff/${id}`, data);
      toast.success('Staff profile updated');
      await fetchStaff();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update staff profile');
      return false;
    }
  };

  const deleteStaff = async (id: number) => {
    try {
      await api.delete(`/api/staff/${id}`);
      toast.success('Staff profile deleted');
      await fetchStaff();
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete staff profile');
      return false;
    }
  };

  return { staff, loading, fetchStaff, createStaff, updateStaff, deleteStaff };
}
