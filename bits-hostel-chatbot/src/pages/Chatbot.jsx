import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle, X, Mic } from "lucide-react";
import {
  LexRuntimeV2Client,
  RecognizeTextCommand,
} from "@aws-sdk/client-lex-runtime-v2";
import { v4 as uuidv4 } from "uuid";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { useNavigate, Link } from "react-router-dom";
import useUser from "../context/useUser";
import WeatherWidget from "../components/WeatherWidget";

import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const polly = new PollyClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

const client = new LexRuntimeV2Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

const sessionId = uuidv4();
const BOT_ID = import.meta.env.VITE_BOT_ID;
const BOT_ALIAS_ID = import.meta.env.VITE_BOT_ALIAS_ID;
const BOT_LOCALE_ID = import.meta.env.VITE_BOT_LOCALE_ID;

const speak = async (text) => {
  try {
    const command = new SynthesizeSpeechCommand({
      OutputFormat: "mp3",
      Text: text,
      VoiceId: "Joanna", // or "Matthew", "Ivy", etc.
    });

    const { AudioStream } = await polly.send(command);
    const blob = new Blob([AudioStream], { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error("Polly TTS error:", error);
  }
};

const Chatbot = () => {
  const { userSession, setUserSession } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "text", text: "Hello! How can I assist you?", sender: "bot" },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate();


  const [isListening, setIsListening] = useState(false);
const [input, setInput] = useState(""); //  chatbot input field


  useEffect(() => {
    const initUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (idToken) {
          const decoded = JSON.parse(atob(idToken.split(".")[1]));
          const email = decoded?.email;

          if (email?.endsWith("@hyderabad.bits-pilani.ac.in")) {
            setUserSession(decoded);

            const sessionKey = `sessionSaved_${decoded.sub}`;
            if (!localStorage.getItem(sessionKey)) {
              await saveSessionToDynamoDB(decoded);
              localStorage.setItem(sessionKey, "true");
            }
          } else {
            alert(
              "Access restricted. Please login with your BITS Hyderabad email."
            );
            await signOut();
            navigate("/");
          }
        }
      } catch (err) {
        console.error("Failed to fetch user session:", err);
      }
    };

    if (!userSession) initUser();
  }, [userSession, setUserSession, navigate]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        const decoded = JSON.parse(atob(idToken.split(".")[1]));
        const email = decoded?.email;
        if (!email) return;

        setLoading(true);

        const response = await fetch(
          `https://flh8pv6hjj.execute-api.ap-northeast-1.amazonaws.com/fetchComplaints?email=${email}`
        );
        const data = await response.json();
        setComplaints(data);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userSession) fetchComplaints();
  }, [userSession]);

  const handleLogout = async () => {
    try {
      await signOut();
      setUserSession(null);
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const saveSessionToDynamoDB = async (decoded) => {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    const sessionPayload = {
      email: decoded?.email,
      name: decoded?.profile,
      sessionId: decoded?.sub,
      loginTime: new Date().toISOString(),
    };

    try {
      await fetch(
        "https://drzy65cmy0.execute-api.ap-northeast-1.amazonaws.com/store-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify(sessionPayload),
        }
      );
    } catch (error) {
      console.error("Error saving session to DynamoDB:", error);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    setMessages((prev) => [
      ...prev,
      { type: "text", text: messageText, sender: "user" },
    ]);
    setInput("");

    const inputParams = {
      botId: BOT_ID,
      botAliasId: BOT_ALIAS_ID,
      localeId: BOT_LOCALE_ID,
      sessionId,
      text: messageText,
      sessionState: {
        sessionAttributes: {
          userId: userSession?.sub || "",
          email: userSession?.email || "",
        },
      },
    };

    try {
      const command = new RecognizeTextCommand(inputParams);
      const response = await client.send(command);
      const lexMessages = [];

      if (response.messages?.length) {
        response.messages.forEach((msg) => {
          if (msg.contentType === "PlainText") {
            lexMessages.push({
              type: "text",
              text: msg.content,
              sender: "bot",
            });
          } else if (msg.contentType === "ImageResponseCard") {
            lexMessages.push({
              type: "card",
              sender: "bot",
              card: {
                title: msg.imageResponseCard.title,
                subTitle: msg.imageResponseCard.subTitle,
                imageUrl: msg.imageResponseCard.imageUrl,
                buttons: msg.imageResponseCard.buttons || [],
              },
            });
          }
        });
      }

      setMessages((prev) => [...prev, ...lexMessages]);
    } catch (error) {
      console.error("Lex Error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "text", text: "Something went wrong with Lex.", sender: "bot" },
      ]);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log("Voice recognition started");
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log("Voice recognition ended");
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      alert("Voice recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) {
        setInput(transcript);
        sendMessage(transcript);
      }
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 bg-white text-gray-900 shadow-sm border-b border-gray-200">
        <h1 className="text-xl font-semibold tracking-tight text-gray-800">
          BITS Hostel Chatbot
        </h1>

        <div className="flex items-center space-x-3">
          {userSession && (
            <span className="text-sm text-gray-500 italic">
              Hi, {userSession.profile}
            </span>
          )}

          <Link to="/">
            <button className="text-sm px-4 py-1.5 rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 transition duration-200">
              Home
            </button>
          </Link>

          {/* Profile Button */}
          {/* <Link to="/profile">
            <button className="text-sm px-4 py-1.5 rounded-full border border-blue-300 text-blue-500 hover:bg-blue-500 hover:text-white transition duration-200">
              Profile
            </button>
          </Link> */}

          <button
            onClick={handleLogout}
            className="text-sm px-4 py-1.5 rounded-full border border-red-300 text-red-500 hover:bg-red-500 hover:text-white transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ✅ Complaint Section */}
      <div className="p-6">
        {/* Weather Widget */}
        <WeatherWidget />

        {loading ? (
          <p className="text-center text-gray-600">Loading complaints...</p>
        ) : complaints.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Your Complaints
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {complaints.map((c, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition duration-300 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {c.ComplaintType}
                      </h3>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          c.Status === "Resolved"
                            ? "bg-green-100 text-green-700"
                            : c.Status === "In Progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {c.Status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Room: <span className="font-medium">{c.RoomNumber}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">No complaints found.</p>
        )}
      </div>

      {/* Floating Chatbot */}
      <div className="flex-1 flex justify-center items-end p-6 relative">
        <div className="fixed bottom-6 right-6 z-50">
          {/* Tooltip animation */}
          {/* Tooltip */}
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-16 right-1/2 translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-md shadow-md pointer-events-none"
            >
              Open chat to register a complaint
            </motion.div>
          )}
          {!isOpen ? (
            <motion.button
              className="p-4 bg-gray-100 text-gray-900 rounded-full shadow-lg hover:bg-gray-200 transition animate-pulse"
              onClick={() => setIsOpen(true)}
              whileHover={{ scale: 1.1 }}
            >
              <MessageCircle size={24} />
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-96 h-[500px] bg-white border border-gray-300 shadow-xl rounded-3xl flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-gray-100 rounded-t-3xl flex justify-between items-center border-b border-gray-300">
                <span className="font-medium">BITS-Chatbot</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.type === "card" ? (
                      <div className="p-3 rounded-lg bg-white border border-gray-300 shadow-md max-w-xs text-gray-900">
                        <h4 className="font-bold">{msg.card.title}</h4>
                        {msg.card.subTitle && (
                          <p className="text-sm text-gray-600">
                            {msg.card.subTitle}
                          </p>
                        )}
                        {msg.card.imageUrl && (
                          <img
                            src={msg.card.imageUrl}
                            alt="Card"
                            className="mt-2 rounded"
                          />
                        )}
                        <div className="mt-2 space-y-1">
                          {msg.card.buttons.map((btn, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(btn.value)}
                              className="w-full bg-gray-200 hover:bg-gray-300 text-left px-3 py-1 rounded"
                            >
                              {btn.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-xl max-w-xs ${
                          msg.sender === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-300 flex items-center bg-gray-100">
                <input
                  type="text"
                  className="flex-1 bg-white border border-gray-300 p-2 rounded-lg outline-none text-gray-900 placeholder-gray-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Type a message..."
                />
                <button
                  onClick={() => sendMessage(input)}
                  className="ml-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                >
                  <Send size={20} className="text-gray-900" />
                </button>
                <button
                  onClick={handleVoiceInput}
                  className={`p-3 rounded-full border shadow transition-colors ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-200 text-black"
                  }`}
                  title="Speak"
                >
                  <Mic size={20} className="text-gray-900" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
