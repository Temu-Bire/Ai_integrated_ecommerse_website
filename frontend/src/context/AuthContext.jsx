import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Login function
  const login = (userData) => {
    setUser(userData);

    // Later replace with JWT token from FastAPI
    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// Custom hook
export function useAuth() {
  return useContext(AuthContext);
}