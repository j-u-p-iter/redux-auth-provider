import { AuthProvider } from "@j.u.p.iter/auth-provider";
import HTTPStatus from "http-status";

import { createUseActions } from "./useActions";

export type UseCheckErrorHook = () => (response, redirectConfig) => void;

export type CreateUseCheckErrorFn = (
  authProvider: AuthProvider
) => UseCheckErrorHook;

export const createUseCheckError: CreateUseCheckErrorFn = authProvider => {
  const useActions = createUseActions(authProvider);

  const useCheckError = () => {
    const { signOut } = useActions();

    return (response, redirectConfig) => {
      const { status: responseStatus } = response;

      if (responseStatus === HTTPStatus.UNAUTHORIZED) {
        signOut();
      }

      authProvider.checkError(response, redirectConfig);
    };
  };

  return useCheckError;
};
