import { AuthProvider } from "@j.u.p.iter/auth-provider";
import { useDispatch } from "react-redux";
import {
  createAction,
  FETCH_CURRENT_USER_WITH_SUCCESS,
  SIGN_IN_WITH_SUCCESS,
  SIGN_OUT,
  SIGN_UP_WITH_SUCCESS
} from "./reducer";

type UserData = any;

export interface Actions {
  getCurrentUser: () => Promise<UserData>;
  signIn: (userData: Partial<UserData>) => Promise<UserData>;
  signUp: (userData: Partial<UserData>) => Promise<UserData>;
  signOut: () => void;
}

type UseActionsHook = () => Actions;
type CreateUseActionsFn = (authProvider: AuthProvider) => UseActionsHook;

export const createUseActions: CreateUseActionsFn = authProvider => {
  const useActions = () => {
    const dispatch = useDispatch();

    return {
      getCurrentUser: async () => {
        const user = await authProvider.getCurrentUser();

        dispatch(createAction(FETCH_CURRENT_USER_WITH_SUCCESS, user));

        return user;
      },
      signIn: async userData => {
        const user = await authProvider.signIn(userData);

        dispatch(createAction(SIGN_IN_WITH_SUCCESS, user));

        return user;
      },
      signUp: async userData => {
        const user = await authProvider.signUp(userData);

        dispatch(createAction(SIGN_UP_WITH_SUCCESS, user));

        return user;
      },
      signOut: () => {
        dispatch(createAction(SIGN_OUT));

        authProvider.signOut();
      }
    };
  };

  return useActions;
};
