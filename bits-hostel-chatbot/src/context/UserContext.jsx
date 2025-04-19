import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(undefined);

// Hook to use UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Provider
const UserProvider = ({ children }) => {
  const [userSession, setUserSession] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("userSession");
    if (saved) {
      setUserSession(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (userSession) {
      localStorage.setItem("userSession", JSON.stringify(userSession));
    } else {
      localStorage.removeItem("userSession");
    }
  }, [userSession]);

  return (
    <UserContext.Provider value={{ userSession, setUserSession }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserProvider, UserContext };