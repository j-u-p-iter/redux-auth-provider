import {
  AuthProvider,
  Response,
  SignInParams
} from "@j.u.p.iter/auth-provider";
import { useDispatch } from "react-redux";
import {
  ASK_NEW_PASSWORD_WITH_SUCCESS,
  createAction,
  FETCH_CURRENT_USER_WITH_SUCCESS,
  RESET_PASSWORD_WITH_SUCCESS,
  SIGN_IN_WITH_SUCCESS,
  SIGN_OUT,
  SIGN_UP_WITH_SUCCESS,
  UPDATE_CURRENT_USER_WITH_SUCCESS
} from "./reducer";

interface UserData {
  [key: string]: any;
}

export interface Actions {
  getCurrentUser: () => Promise<Response>;
  updateCurrentUser: (data: Partial<UserData>) => Promise<Response>;
  signIn: (data: SignInParams) => Promise<Response>;
  signUp: (userData: Partial<UserData>) => Promise<Response>;
  signOut: () => void;
  askNewPassword: (data: { email: string }) => void;
  resetPassword: (data: { token: string; password: string }) => void;
}

type UseActionsHook = () => Actions;
type CreateUseActionsFn = (authProvider: AuthProvider) => UseActionsHook;

export const createUseActions: CreateUseActionsFn = authProvider => {
  const useActions = () => {
    const dispatch = useDispatch();

    return {
      getCurrentUser: async () => {
        const { data: user, error } = await authProvider.getCurrentUser();

        if (error) {
          return { error };
        }

        if (user) {
          dispatch(createAction(FETCH_CURRENT_USER_WITH_SUCCESS, user));
        } else {
          dispatch(createAction(SIGN_OUT));
        }

        return { data: user };
      },

      updateCurrentUser: async dataToUpdate => {
        const { data: user, error } = await authProvider.updateCurrentUser(
          dataToUpdate
        );

        if (error) {
          return { error };
        }

        dispatch(createAction(UPDATE_CURRENT_USER_WITH_SUCCESS, user));

        return { data: user };
      },

      signIn: async params => {
        const { error, data: user } = await authProvider.signIn(params);

        if (error) {
          return { error };
        }

        dispatch(createAction(SIGN_IN_WITH_SUCCESS, user));

        return { data: user };
      },
      signUp: async userData => {
        const { error, data: user } = await authProvider.signUp(userData);

        if (error) {
          return { error };
        }

        dispatch(createAction(SIGN_UP_WITH_SUCCESS, user));

        return { data: user };
      },

      signOut: () => {
        dispatch(createAction(SIGN_OUT));

        authProvider.signOut();
      },

      askNewPassword: async ({ email }) => {
        const response = await authProvider.askNewPassword({
          email
        });

        if (response) {
          return { error: response.error };
        }

        dispatch(createAction(ASK_NEW_PASSWORD_WITH_SUCCESS));
      },

      resetPassword: async ({ token, password }) => {
        const response = await authProvider.resetPassword({
          token,
          password
        });

        if (response) {
          return { error: response.error };
        }

        dispatch(createAction(RESET_PASSWORD_WITH_SUCCESS));
      }
    };
  };

  return useActions;
};
