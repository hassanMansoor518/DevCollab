import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ withCredentials: true });

export const workspaceKeys = {
  all: ['workspaces'],
  detail: (id) => ['workspace', id],
  availableUsers: ['availableUsers'],
};

export const useWorkspace = (workspaceId) => {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: async () => {
      if (!workspaceId) return null;
      const { data } = await api.get(`/api/workspace/${workspaceId}`);
      return data;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateWorkspaceName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, name }) => {
      const { data } = await api.put(`/api/workspace/${workspaceId}`, { name });
      return data;
    },
    onSuccess: (data, { workspaceId }) => {
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), data);
      toast.success('Workspace name updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to rename workspace');
    },
  });
};

export const useUpdateWorkspaceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, settings }) => {
      const { data } = await api.put(`/api/workspace/${workspaceId}/settings`, { settings });
      return data;
    },
    onSuccess: (data, { workspaceId }) => {
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), data);
      toast.success('Settings updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });
};

export const useWorkspaceActivities = (workspaceId) => {
  return useQuery({
    queryKey: ['workspaceActivities', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data } = await api.get(`/api/activity/workspace/${workspaceId}`);
      return data;
    },
    enabled: !!workspaceId,
  });
};

export const useGetAvailableUsers = (workspaceId) => {
  return useQuery({
    queryKey: workspaceKeys.availableUsers,
    queryFn: async () => {
      const { data } = await api.get('/api/auth/alluser');
      return data;
    },
  });
};

export const useAddMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, userIds }) => {
      await Promise.all(
        userIds.map((userId) => api.post(`/api/workspace/${workspaceId}/add-member`, { userId }))
      );
      const { data } = await api.get(`/api/workspace/${workspaceId}`);
      return data;
    },
    onSuccess: (data, { workspaceId }) => {
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), data);
      toast.success('Members added successfully');
    },
    onError: () => {
      toast.error('Unable to add selected members');
    },
  });
};

export const useToggleAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, memberId, isAdmin }) => {
      const { data } = await api.patch(`/api/workspace/${workspaceId}/admin/${memberId}`, { isAdmin });
      return data;
    },
    onSuccess: (data, { workspaceId }) => {
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), data);
      toast.success('Admin rights updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update admin rights');
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, memberId }) => {
      const { data } = await api.delete(`/api/workspace/${workspaceId}/member/${memberId}`);
      return data;
    },
    onSuccess: (data, { workspaceId }) => {
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), data);
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Could not remove member');
    },
  });
};

export const useTransferOwnership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, newOwnerId }) => {
      const { data } = await api.post(`/api/workspace/${workspaceId}/transfer`, { newOwnerId });
      return data;
    },
    onSuccess: (data, { workspaceId }) => {
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), data);
      toast.success('Ownership transferred successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to transfer ownership');
    },
  });
};

export const useLeaveWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workspaceId, userId }) => {
      await api.delete(`/api/workspace/${workspaceId}/member/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      toast.success('You have left the workspace');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Could not leave workspace');
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId) => {
      await api.delete(`/api/workspace/${workspaceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      toast.success('Workspace deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Could not delete workspace');
    },
  });
};
