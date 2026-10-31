import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("joblens_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      setUser(res.data.data.user);
      setProfile(res.data.data.profile);
    } catch {
      localStorage.removeItem("joblens_token");
      localStorage.removeItem("joblens_user");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadUser();
  }, [loadUser]);
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: u, profile: p } = res.data.data;
    localStorage.setItem("joblens_token", token);
    setUser(u);
    setProfile(p);
    return { user: u, profile: p };
  };
  const logout = () => {
    localStorage.removeItem("joblens_token");
    localStorage.removeItem("joblens_user");
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  };
  const refreshProfile = async () => {
    const res = await authAPI.getMe();
    setProfile(res.data.data.profile);
    return res.data.data.profile;
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout,
        refreshProfile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
