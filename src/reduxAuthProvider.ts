import { AuthProvider } from "@j.u.p.iter/auth-provider";
import { createUseMutation, UseMutationHook } from "./useMutation";
import { createUseQuery, UseQueryHook } from "./useQuery";

interface ReduxAuthProvider {
  useMutation: UseMutationHook;
  useQuery: UseQueryHook;
}

export type CreateReduxAuthProviderFn = (
  authProvider: AuthProvider
) => ReduxAuthProvider;

export const createReduxAuthProvider: CreateReduxAuthProviderFn = authProvider => {
  const useMutation = createUseMutation(authProvider);
  const useQuery = createUseQuery(authProvider);

  return {
    useMutation,
    useQuery
  };
};
