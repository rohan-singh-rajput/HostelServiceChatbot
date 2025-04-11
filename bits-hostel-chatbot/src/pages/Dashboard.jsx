// src/pages/Dashboard.jsx
import { useAuth } from "../context/AuthContext";
import Chatbot from "../pages/Chatbot/";
import { useEffect, useState } from "react";

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
  const { user, logout } = useAuth();
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    const filtered = mockRequests.filter((r) => r.userEmail === user?.email);
    setMyRequests(filtered);
  }, [user]);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user?.name || "BITSian"}</h1>
        <button
          onClick={logout}
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
      <Chatbot />
    </div>
  );
}
