import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle, X, Mic } from "lucide-react";
import { LexRuntimeV2Client, RecognizeTextCommand } from "@aws-sdk/client-lex-runtime-v2";
import { v4 as uuidv4 } from "uuid";

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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "text", text: "Hello! How can I assist you?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

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
            <span className="font-medium">Chatbot</span>
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
                    {msg.card.subTitle && <p className="text-sm text-gray-600">{msg.card.subTitle}</p>}
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
                      msg.sender === "user" ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-900"
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
            <button onClick={() => sendMessage(input)} className="ml-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
              <Send size={20} className="text-gray-900" />
            </button>
            <button
              onClick={handleVoiceInput}
              className={`ml-2 p-2 rounded-full transition ${isListening ? "bg-gray-300" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              <Mic size={20} className="text-gray-900" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Chatbot;
