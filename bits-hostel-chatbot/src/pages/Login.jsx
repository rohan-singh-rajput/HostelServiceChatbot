import React, { useEffect } from "react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes, getCurrentUser, signOut } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import "@aws-amplify/ui-react/styles.css";

function Login({ user }) {
  const navigate = useNavigate();

  useEffect(() => {
    const validateEmailDomain = async () => {
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const email = attributes?.email;

        if (!email) {
          throw new Error("No email found in user attributes");
        }

        console.log("Authenticated user email:", email);

        if (email.endsWith("@hyderabad.bits-pilani.ac.in")) {
          navigate("/chat");
        } else {
          alert("Please use your BITS Hyderabad email address to login.");
          await signOut();
          navigate("/");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        await signOut();
        navigate("/");
      }
    };

    if (user) {
      validateEmailDomain();
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="bg-white text-black p-8 rounded-xl shadow-xl space-y-4">
        <h2 className="text-xl font-bold">Welcome, {user?.username || "User"}</h2>
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

// Amplify Gen 2
export default withAuthenticator(Login, {
  socialProviders: ["google"],
});
