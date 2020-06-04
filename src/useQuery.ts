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
    const [error, setError] = useState<string>();
    const { getCurrentUser } = useActions();

    const query = async () => {
      setError("");
      setIsLoading(true);

      const { data: userData, error: errorData } = await getCurrentUser();

      setIsLoading(false);

      if (errorData) {
        setError(errorData);
        return;
      }

      setData(userData);
    };

    useEffect(() => {
      query();
    }, []);

    return { data, isLoading, query, error };
  };

  return useQuery;
};
