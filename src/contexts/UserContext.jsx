import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabaseConfig/supabaseClient";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          createProfileFromUser(session.user);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error getting initial session:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        createProfileFromUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createProfileFromUser = (user) => {
    const role = user.user_metadata?.role?.toLowerCase();

    const basicProfile = {
      first_name: user.user_metadata?.first_name || user.email?.split("@")[0],
      last_name: user.user_metadata?.last_name || "",
      email: user.email,
      role: role || "user",
      faculty: user.user_metadata?.faculty || "",
      department: user.user_metadata?.department || "",
    };

    setProfile(basicProfile);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signOut,
    createProfileFromUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
