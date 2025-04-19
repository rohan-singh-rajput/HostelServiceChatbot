import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle, X, Mic } from "lucide-react";
import { LexRuntimeV2Client, RecognizeTextCommand } from "@aws-sdk/client-lex-runtime-v2";
import { v4 as uuidv4 } from "uuid";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { useNavigate, Link } from "react-router-dom";
import useUser from "../context/useUser";

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

const Chatbot = () => {
  const { userSession, setUserSession } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "text", text: "Hello! How can I assist you?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  //userSession
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
          } else {
            alert("Access restricted. Please login with your BITS Hyderabad email.");
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

  const handleLogout = async () => {
    try {
      await signOut();
      setUserSession(null);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    setMessages((prev) => [...prev, { type: "text", text: messageText, sender: "user" }]);
    setInput("");

    const inputParams = {
      botId: BOT_ID,
      botAliasId: BOT_ALIAS_ID,
      localeId: BOT_LOCALE_ID,
      sessionId,
      text: messageText,
    };

    try {
      const command = new RecognizeTextCommand(inputParams);
      const response = await client.send(command);
      const lexMessages = [];

      if (response.messages?.length) {
        response.messages.forEach((msg) => {
          if (msg.contentType === "PlainText") {
            lexMessages.push({ type: "text", text: msg.content, sender: "bot" });
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
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support voice recognition.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/*  NAVBAR */}
      <div className="flex justify-between items-center px-6 py-4 bg-black text-white shadow-md">
        <h1 className="text-2xl font-bold">BITS Hostel Chatbot</h1>
        <div className="flex items-center space-x-4">
          {userSession && <span className="text-green-300">Welcome, {userSession.profile}</span>}
          <Link to="/">
            <button className="border px-4 py-1 rounded hover:bg-white hover:text-black transition">
              Home
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="border px-4 py-1 rounded hover:bg-white hover:text-black transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* CHAT WIDGET */}
      <div className="flex-1 flex justify-center items-end p-6 relative">
        <div className="fixed bottom-6 right-6 z-50">
          {!isOpen ? (
            <motion.button
              className="p-4 bg-gray-100 text-gray-900 rounded-full shadow-lg hover:bg-gray-200 transition"
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
                <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-gray-900 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${msg.sender === "user" ? "ml-auto" : ""}`}
                  >
                    {msg.type === "card" ? (
                      <div className="p-3 rounded-lg bg-white border border-gray-300 shadow-md max-w-xs text-gray-900">
                        <h4 className="font-bold">{msg.card.title}</h4>
                        {msg.card.subTitle && (
                          <p className="text-sm text-gray-600">{msg.card.subTitle}</p>
                        )}
                        {msg.card.imageUrl && (
                          <img src={msg.card.imageUrl} alt="Card" className="mt-2 rounded" />
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
                        className={`p-3 rounded-lg max-w-xs ${
                          msg.sender === "user"
                            ? "bg-gray-200 text-gray-900"
                            : "bg-gray-100 text-gray-900"
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
                  className={`ml-2 p-2 rounded-full transition ${
                    isListening ? "bg-gray-300" : "bg-gray-100 hover:bg-gray-200"
                  }`}
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
