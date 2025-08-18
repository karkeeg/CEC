import React, { createContext, useContext, useState } from "react";
import { fetchStudentProfileById, fetchTeacherProfileById } from "../supabaseConfig/supabaseApi";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem("role") || null;
  });
  const [loading] = useState(false); // Always false with sync init
  const [profile, setProfile] = useState(null);

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId, role) => {
    if (!userId || !role) return;
    if (role === "student") {
      const student = await fetchStudentProfileById(userId);
      setProfile(student || null);
    } else if (role === "teacher") {
      const teacher = await fetchTeacherProfileById(userId);
      setProfile(teacher || null);
    }
  };

  // Fetch profile on login/app load
  React.useEffect(() => {
    if (user && role) fetchUserProfile(user.id, role);
  }, [user, role]);

  const signOut = () => {
    localStorage.clear();
    setUser(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        signOut,
        setUser,
        setRole,
        loading,
        profile,
        setProfile,
        fetchUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
