import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { logger } from '@/lib/observability/logger';
import { queryKeys } from '@/lib/query-keys';
import { User } from '@/types';

export function useUsers(filters?: string) {
  return useQuery({
    queryKey: queryKeys.users.list(filters || ''),
    queryFn: (ctx) => api.get<User[]>('/users', ctx).then(res => res.data),
    enabled: true,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: (ctx) => api.get<User>(`/users/${id}`, ctx).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => api.post<User>('/users', data).then(res => res.data),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.setQueryData<User[]>(
        queryKeys.users.lists(),
        (old) => old ? [...old, newUser] : [newUser]
      );
    },
    onError: (error) => {
      logger.error('Failed to create user:', { message: (error as Error)?.message, error });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => api.put<User>(`/users/${id}`, data).then(res => res.data),
    onMutate: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) });
      const previousUser = queryClient.getQueryData<User>(queryKeys.users.detail(id));
      queryClient.setQueryData<User>(
        queryKeys.users.detail(id),
        (old: User | undefined) => old ? { ...old, ...updatedUser } : old
      );
      return { previousUser };
    },
    onError: (err, updatedUser, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.users.detail(id), context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`).then(res => res.data),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(deletedId) });
    },
  });
}
