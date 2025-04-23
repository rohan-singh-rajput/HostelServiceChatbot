import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chatbot from "./pages/Chatbot";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";
import useUser from "./context/useUser"; 
// import ProfilePage from "./pages/ProfilePage";

// Configure Amplify OAuth
Amplify.configure({
  ...awsconfig,
  oauth: {
    ...awsconfig.oauth,
    scope: ["openid", "email", "profile"],
    responseType: "code",
  },
});

// Protected route using UserContext
function ProtectedRoute({ children }) {
  const { userSession, loading } = useUser();

  if (loading) {
    return <div className="text-white p-4">Loading session...</div>;
  }

  return userSession ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={<Chatbot />} />
      {/* <Route path="/profile" element={<ProfilePage />} /> */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<div>404: Page Not Found</div>} />
    </Routes>
  );
}
