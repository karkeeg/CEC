import React, { createContext, useContext, useState } from "react";

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

  const signOut = () => {
    localStorage.clear();
    setUser(null);
    setRole(null);
  };

  return (
    <UserContext.Provider
      value={{ user, role, signOut, setUser, setRole, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};
