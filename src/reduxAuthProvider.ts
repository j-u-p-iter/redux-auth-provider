import { AuthProvider } from "@j.u.p.iter/auth-provider";
import { createUseCheckError, UseCheckErrorHook } from "./useCheckError";
import { createUseMutation, UseMutationHook } from "./useMutation";
import { createUseQuery, UseQueryHook } from "./useQuery";
import { useStoreState as useState, UseStoreStateHook } from "./useStoreState";

interface ReduxAuthProvider {
  useMutation: UseMutationHook;
  useQuery: UseQueryHook;
  useState: UseStoreStateHook;
  useCheckError: UseCheckErrorHook;
}

export type CreateReduxAuthProviderFn = (
  authProvider: AuthProvider
) => ReduxAuthProvider;

export const createReduxAuthProvider: CreateReduxAuthProviderFn = authProvider => {
  const useMutation = createUseMutation(authProvider);
  const useQuery = createUseQuery(authProvider);
  const useCheckError = createUseCheckError(authProvider);

  return {
    useMutation,
    useQuery,
    useState,
    useCheckError
  };
};
