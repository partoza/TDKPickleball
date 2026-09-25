import { useState, useCallback } from 'react';
import { api, getApiErrorMessage } from '@/services/api';
import { InternalCoachProfile, InternalCoachType } from '@/types';
import { toast } from 'sonner';

type InternalCoachCreatePayload = Pick<InternalCoachProfile, 'name' | 'email' | 'phone' | 'type'>;
type InternalCoachUpdatePayload = InternalCoachCreatePayload & Pick<InternalCoachProfile, 'isActive'>;

export function useInternalCoaches() {
  const [internalCoaches, setInternalCoaches] = useState<InternalCoachProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInternalCoaches = useCallback(async (type?: InternalCoachType) => {
    try {
      setLoading(true);
      const url = type !== undefined ? `/api/internal-coaches?type=${type}` : '/api/internal-coaches';
      const response = await api.get<{ data: InternalCoachProfile[] }>(url);
      setInternalCoaches(response.data.data);
    } catch (error) {
      console.error('Failed to fetch internal and coach profiles:', error);
      toast.error(getApiErrorMessage(error, 'Failed to load Internal & Coaches'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createInternalCoach = async (data: InternalCoachCreatePayload) => {
    try {
      const response = await api.post<{ data: InternalCoachProfile }>('/api/internal-coaches', data);
      toast.success('Profile created');
      await fetchInternalCoaches();
      return response.data.data;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to create profile'));
      return null;
    }
  };

  const updateInternalCoach = async (id: number, data: InternalCoachUpdatePayload) => {
    try {
      const response = await api.put<{ data: InternalCoachProfile }>(`/api/internal-coaches/${id}`, data);
      toast.success('Profile updated');
      await fetchInternalCoaches();
      return response.data.data;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to update profile'));
      return null;
    }
  };

  const uploadProfileImage = async (id: number, image: File) => {
    try {
      const form = new FormData();
      form.append('image', image);
      // Axios/browser supplies the multipart boundary. Setting this header by
      // hand can produce an invalid request body in some browser versions.
      await api.post(`/api/internal-coaches/${id}/profile-image`, form);
      toast.success('Profile photo uploaded');
      await fetchInternalCoaches();
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to upload profile photo'));
      return false;
    }
  };

  const removeProfileImage = async (id: number) => {
    try {
      await api.delete(`/api/internal-coaches/${id}/profile-image`);
      toast.success('Profile photo removed');
      await fetchInternalCoaches();
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to remove profile photo'));
      return false;
    }
  };

  const deleteInternalCoach = async (id: number, credentials: { email: string; password: string }) => {
    try {
      await api.post(`/api/internal-coaches/${id}/delete`, credentials);
      toast.success('Profile deleted');
      await fetchInternalCoaches();
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Failed to delete profile'));
      return false;
    }
  };

  return { internalCoaches, loading, fetchInternalCoaches, createInternalCoach, updateInternalCoach, uploadProfileImage, removeProfileImage, deleteInternalCoach };
}
