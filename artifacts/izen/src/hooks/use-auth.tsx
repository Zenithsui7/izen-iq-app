import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, useGuestLogin } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem("izen_token");
  });

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("izen_token", newToken);
    } else {
      localStorage.removeItem("izen_token");
    }
  };

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("izen_token"));
  }, []);

  const guestLogin = useGuestLogin();

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (error) {
      setToken(null);
    }
  }, [error]);

  // Auto-create a guest session if no token exists
  useEffect(() => {
    if (!token && !guestLogin.isPending && !guestLogin.isSuccess) {
      guestLogin.mutate(undefined, {
        onSuccess: (data) => setToken(data.token),
      });
    }
  }, [token]);

  const isInitializing = !token || (isLoading && !!token) || guestLogin.isPending;

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        isAuthenticated: !!user,
        isLoading: isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
