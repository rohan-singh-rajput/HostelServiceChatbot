import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="h-screen w-full bg-black flex flex-col justify-center items-center text-white font-sans">
      
      <motion.h1
        className="text-5xl md:text-6xl font-extrabold text-white tracking-tight"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        BITS Hostel Chatbot
      </motion.h1>

      <motion.p
        className="text-center max-w-md mt-4 text-gray-400 text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        Streamline your hostel life — report issues, book facilities, and get instant support.
      </motion.p>

      <motion.div
        className="mt-10 flex gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <Link to="/chat">
          <button className="px-6 py-3 rounded-2xl text-black bg-white hover:bg-gray-200 shadow-md transition-all duration-300 hover:scale-105">
            Launch Chatbot
          </button>
        </Link>

        <Link to="/login">
          <button className="px-6 py-3 rounded-2xl border border-white text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105">
            Login
          </button>
        </Link>
      </motion.div>
    </div>
  )
}
