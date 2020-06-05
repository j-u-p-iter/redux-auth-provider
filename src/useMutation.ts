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

  const initialState = {
    isLoading: false,
    data: {},
    error: ""
  };

  const useMutation = mutationName => {
    const actions = useActions();
    const [state, setState] = useState(initialState);

    const mutation = actions[mutationName];

    const callMutation = async (...args) => {
      setState({ ...initialState, error: "", isLoading: true });

      const response = await mutation(...args);

      if (!response) {
        setState({ ...initialState, isLoading: false });
        return;
      }

      const { error: errorData, data: userData } = response;

      if (errorData) {
        setState({ ...initialState, isLoading: false, error: errorData });
        return;
      }

      setState({ ...initialState, isLoading: false, data: userData });
    };

    return {
      ...state,
      mutation: callMutation
    };
  };

  return useMutation;
};
