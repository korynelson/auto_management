import { useState, useEffect, createContext, useContext } from 'react';
import { insforge } from '../lib/insforge';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await insforge.auth.getCurrentUser();
      setUser(data?.user || null);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoaded(true);
    }
  };

  const signUp = async (email, password, name) => {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name
    });
    return { data, error };
  };

  const verifyEmail = async (email, otp) => {
    const { data, error } = await insforge.auth.verifyEmail({
      email,
      otp
    });
    if (data?.user) {
      setUser(data.user);
    }
    return { data, error };
  };

  const resendVerificationEmail = async (email) => {
    const { data, error } = await insforge.auth.resendVerificationEmail({
      email
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password
    });
    if (data?.user) {
      setUser(data.user);
    }
    return { data, error };
  };

  const signOut = async () => {
    await insforge.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    isLoaded,
    isSignedIn: !!user,
    signUp,
    verifyEmail,
    resendVerificationEmail,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
