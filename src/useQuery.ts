import { AuthProvider } from "@j.u.p.iter/auth-provider";
import { useEffect, useState } from "react";

import { createUseActions } from "./useActions";

export type UseQueryHook = () => {
  data: any;
  isLoading: boolean;
  query: () => void;
};

type CreateUseQueryFn = (authProvider: AuthProvider) => UseQueryHook;
export const createUseQuery: CreateUseQueryFn = authProvider => {
  const useActions = createUseActions(authProvider);

  const useQuery = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState({});
    const { getCurrentUser } = useActions();

    const query = async () => {
      const userData = await getCurrentUser();

      setData(userData);
      setIsLoading(false);
    };

    useEffect(() => {
      query();
    }, []);

    return { data, isLoading, query };
  };

  return useQuery;
};
