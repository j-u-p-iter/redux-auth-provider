import { useSelector } from "react-redux";

import { State } from "./reducer";

export type UseStoreStateHook = () => State;
export const useStoreState: UseStoreStateHook = () => {
  const selector = ({ auth }) => auth;
  const { currentUser, isSignedIn } = useSelector(selector);

  return {
    currentUser,
    isSignedIn
  };
};
