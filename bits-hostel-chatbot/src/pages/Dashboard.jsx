// src/pages/Dashboard.jsx

import { useEffect, useState } from "react";
import useUser from '../context/useUser';
import { signOut } from "aws-amplify/auth";
import Chatbot from "../pages/Chatbot/";

const mockRequests = [
  {
    id: 1,
    userEmail: "student1@hyderabad.bits-pilani.ac.in",
    title: "Leaking Tap",
    status: "Pending",
  },
  {
    id: 2,
    userEmail: "student2@hyderabad.bits-pilani.ac.in",
    title: "AC Not Working",
    status: "Resolved",
  },
];

export default function Dashboard() {
  const { userSession, setUserSession } = useUser();
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    if (userSession?.email) {
      const filtered = mockRequests.filter(
        (r) => r.userEmail === userSession.email
      );
      setMyRequests(filtered);
    }
  }, [userSession]);

  const handleLogout = async () => {
    try {
      await signOut();
      setUserSession(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Welcome, {userSession?.profile || "BITSian"}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          Logout
        </button>
      </div>

     

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Requests</h2>
        {myRequests.length === 0 ? (
          <p className="text-gray-600">No tickets found.</p>
        ) : (
          <ul className="space-y-4">
            {myRequests.map((req) => (
              <li
                key={req.id}
                className="p-4 border border-gray-300 rounded-xl shadow-sm flex justify-between"
              >
                <span>{req.title}</span>
                <span className="text-sm text-gray-500">{req.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating Chatbot Button */}
    </div>
  );
}
