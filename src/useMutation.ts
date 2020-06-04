import { AuthProvider } from "@j.u.p.iter/auth-provider";
import { useState } from "react";

import { Actions, createUseActions } from "./useActions";

export type UseMutationHook = (
  mutationName: string
) => {
  mutation:
    | Actions["signIn"]
    | Actions["signUp"]
    | Actions["signOut"]
    | Actions["updateCurrentUser"]
    | Actions["askNewPassword"]
    | Actions["resetPassword"];
  isLoading: boolean;
};

export type CreateUseMutationFn = (
  authProvider: AuthProvider
) => UseMutationHook;

export const createUseMutation: CreateUseMutationFn = authProvider => {
  const useActions = createUseActions(authProvider);

  const useMutation = mutationName => {
    const actions = useActions();
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState({});
    const [error, setError] = useState<string>("");

    const mutation = actions[mutationName];

    const callMutation = async (...args) => {
      setError("");
      setIsLoading(true);

      const response = await mutation(...args);

      setIsLoading(false);

      if (!response) {
        return;
      }

      const { error: errorData, data: userData } = response;

      if (errorData) {
        setError(errorData);
        return;
      }

      setData(userData);
    };

    return {
      data,
      error,
      isLoading,
      mutation: callMutation
    };
  };

  return useMutation;
};
