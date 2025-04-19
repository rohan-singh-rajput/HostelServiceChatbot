import React, { useEffect, useState } from "react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import {
  fetchAuthSession,
  getCurrentUser,
  signOut,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils"; 
import { useNavigate } from "react-router-dom";
import "@aws-amplify/ui-react/styles.css";
import useUser from "../context/useUser";

function Login({ user }) {
  const navigate = useNavigate();
  const { userSession, setUserSession } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  const validateEmailDomain = async () => {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("No ID token found");

      const decoded = JSON.parse(atob(idToken.split(".")[1]));
      const email = decoded?.email;

      if (email.endsWith("@hyderabad.bits-pilani.ac.in")) {
        setUserSession(decoded);
        navigate("/chat");
      } else {
        alert("Please use your BITS Hyderabad email address to login.");
        await signOut();
        navigate("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      await signOut();
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  // user login after OAuth redirect
  useEffect(() => {
    const listener = ({ payload }) => {
      if (payload.event === "signInWithRedirect") {
        console.log("OAuth login complete. Verifying user...");
        validateEmailDomain();
      }
    };

    const unsubscribe = Hub.listen("auth", listener);

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    if (user && !userSession) {
      console.log("User prop available, validating immediately...");
      validateEmailDomain();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-lg animate-pulse">Authenticating...</div>
      </div>
    );
  }

  if (!userSession) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-lg">Please log in to continue.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="bg-white text-black p-8 rounded-xl shadow-xl space-y-4">
        <h2 className="text-xl font-bold">Welcome, {userSession?.profile || "User"}</h2>
        <button
          onClick={signOut}
          className="bg-red-600 px-4 py-2 rounded-lg text-white hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default withAuthenticator(Login, {
  socialProviders: ["google"],
});
