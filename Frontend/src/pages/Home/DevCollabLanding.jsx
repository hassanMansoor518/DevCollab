import React, { useState } from "react";
import { Search, Code2, BookOpen } from "lucide-react";
import { FaProjectDiagram, FaComments, FaServer, FaCog, FaGithub } from "react-icons/fa";
import { AiOutlineRobot } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../auth/Login";
import Signup from "../auth/Signup";

export default function DevCollabLanding() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerChildren = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };

  return (

    
    <div className="relative min-h-screen bg-[#0B1120] text-white">
    
      {/* ===== BLUR WRAPPER ===== */}
      <div
        className={`${showLogin || showSignup ? "blur-sm scale-95" : ""} transition-all duration-300`}
      >

        {/* ================= NAVBAR ================= */}
        <motion.nav
          className="flex items-center justify-between px-15 py-4 border-b border-slate-800"
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
        >
          <motion.div className="flex items-center gap-2" variants={fadeInUp}>
            <div className="bg-blue-600 p-2 rounded-md">
              <Code2 size={18} />
            </div>
            <span className="font-semibold text-lg">DevCollab</span>
          </motion.div>

          <motion.div
            className="hidden md:flex gap-8 text-sm text-slate-300"
            variants={fadeInUp}
          >
            <a href="#">Features</a>
            <a href="#">Projects</a>
            <a href="#">Teams</a>
            <a href="#">AI Features</a>
          </motion.div>

          {/* ===== LOGIN + SIGNUP BUTTONS ===== */}
          <motion.div className="flex items-center gap-4" variants={fadeInUp}>
            <button
              className="text-sm text-slate-300 hover:text-white"
              onClick={() => {
                setShowSignup(false);
                setShowLogin(true);
                
              } }
            >
              Login
            </button>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-sm px-4 py-2 rounded-lg font-medium"
              onClick={() => {
                setShowLogin(false);
                setShowSignup(true);
             
              } }
            >
              Sign Up
            </button>
          </motion.div>
        </motion.nav>

      {/* ======= REST OF YOUR ORIGINAL CODE (UNCHANGED) ======= */}


      {/* ================= HERO SECTION ================= */}
      <section className="text-center py-20 px-6 relative">
        <motion.div initial="hidden" animate="visible" variants={staggerChildren}>
          {/* Small Badge */}
          <motion.div
            className="inline-block bg-blue-900/30 text-blue-400 px-4 py-1 rounded-full text-xs mb-6"
            variants={fadeInUp}
          >
            🚀 We are now live with AI pair programming
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-4xl md:text-6xl font-bold leading-tight"
            variants={fadeInUp}
          >
            Ship code{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              10x faster
            </span>{" "}
            with <br />
            AI collaboration
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-slate-400 max-w-2xl mx-auto mt-6 text-sm md:text-base"
            variants={fadeInUp}
          >
            The unified workspace for modern engineering teams. Real-time chat,
            project management, and a world-class AI assistant in one unified
            hub.
          </motion.p>

          {/* Buttons */}
          <motion.div className="mt-8 flex justify-center gap-4" variants={fadeInUp}>
            <button
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium shadow-lg"
              onClick={() => {
                setShowLogin(true);
                setShowSignup(false);
              }}
            >
              Get Started Free
            </button>

            <button className="border border-slate-700 px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-slate-800">
              <BookOpen size={16} />
              Book Demo
            </button>
          </motion.div>
        </motion.div>

        {/* ================= PREVIEW CARD ================= */}
        <motion.div className="mt-20 max-w-6xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerChildren}>
          <motion.div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-[0_0_80px_rgba(59,130,246,0.08)] overflow-hidden" variants={fadeInUp}>

            {/* ================= TOP BAR ================= */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111827]">
              <div className="flex gap-6 text-sm">
                <span className="text-white font-medium border-b-2 border-blue-500 pb-1 flex items-center gap-1">
                  <FaProjectDiagram /> Projects
                </span>
                <span className="text-slate-400 hover:text-white cursor-pointer flex items-center gap-1">
                  <FaServer /> Pipeline
                </span>
                <span className="text-slate-400 hover:text-white cursor-pointer flex items-center gap-1">
                  <FaGithub /> Pull Requests
                </span>
              </div>

              <span className="text-xs text-green-400">● 2 repositories active</span>
            </div>

            {/* ================= CONTENT GRID ================= */}
            <div className="grid grid-cols-12">

              {/* ===== LEFT MINI SIDEBAR ===== */}
              <div className="col-span-2 border-r border-slate-800 bg-[#0B1120] p-4 flex flex-col justify-between text-xs">

                {/* Sidebar Menu */}
                <div className="space-y-3">
                  <div className="bg-blue-600/10 text-blue-400 px-3 py-2 rounded-md flex items-center gap-2">
                    <FaProjectDiagram /> Projects
                  </div>
                  <div className="text-slate-400 px-3 py-2 rounded-md hover:bg-slate-800 cursor-pointer flex items-center gap-2">
                    <FaComments /> Conversations
                  </div>
                  <div className="text-slate-400 px-3 py-2 rounded-md hover:bg-slate-800 cursor-pointer flex items-center gap-2">
                    <FaServer /> Deployments
                  </div>
                  <div className="text-slate-400 px-3 py-2 rounded-md hover:bg-slate-800 cursor-pointer flex items-center gap-2">
                    <FaCog /> Settings
                  </div>
                </div>

                {/* User Login at Bottom */}
                <div className="mt-6 flex items-center gap-2 px-3 py-2 border-t border-slate-800">
                  <img
                    src="https://i.pravatar.cc/24?img=12"
                    alt="Alex"
                    className="w-7 h-7 rounded-full" />
                  <div>
                    <span className="text-white text-xs">Hassan Mansoor</span>
                    <div className="text-slate-400 text-xs">Developer</div>
                  </div>
                </div>
              </div>

              {/* ===== MIDDLE SECTION ===== */}
              <div className="col-span-6 p-6 space-y-6 border-r border-slate-800">
                {/* Active Repositories */}
                <div>
                  <h4 className="text-sm text-white font-semibold mb-4 flex items-center gap-2">
                    <FaGithub /> Active Repositories
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-[#111827] px-4 py-3 rounded-lg border border-slate-800">
                      <span className="text-slate-300 flex items-center gap-2">
                        <FaGithub /> core-api-service
                      </span>
                      <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px]">
                        STABLE
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-[#111827] px-4 py-3 rounded-lg border border-slate-800">
                      <span className="text-slate-300 flex items-center gap-2">
                        <FaGithub /> mobile-client-app
                      </span>
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px]">
                        BUILDING
                      </span>
                    </div>
                  </div>
                </div>

                {/* ===== Code Block ===== */}
                <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                  {/* Header Bar */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#111827] border-b border-slate-800">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="ml-2 text-xs text-slate-400 font-mono">deploy.js</span>
                  </div>
                  {/* Code Content */}
                  <pre className="p-5 font-mono text-xs leading-6 text-white overflow-x-auto">
                    <code>
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-400">deploy</span>{" "}
                      <span className="text-white">=</span>{" "}
                      <span className="text-purple-400">async</span>{" "}
                      <span className="text-white">() {"=> {"}</span>
                      {"\n"}
                      <span className="text-slate-400"> // Initialize deployment layer</span>
                      {"\n"}
                      <span className="text-green-400">  await build();</span>
                      {"\n"}
                      <span className="text-yellow-400">  console.log('Server initialized');</span>
                      {"\n"}
                      <span className="text-white">{"}"}</span>
                    </code>
                  </pre>
                </div>
              </div>

              {/* ===== RIGHT AI PANEL ===== */}
              <div className="col-span-4 p-6 bg-[#0B1120]">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <AiOutlineRobot /> DevCollab AI
                </h4>
                <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 text-xs text-slate-300 mb-6">
                  I see an opportunity to improve your authentication layer.
                  Consider implementing token refresh logic and role validation.
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                  <AiOutlineRobot /> Ask DevCollab AI
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>

      </section>

      {/* ================= FEATURES ================= */}
      <section className="relative py-24 px-6 border-t border-slate-800 bg-[#0B1120]">
        <div className="max-w-6xl mx-auto">
          {/* Top Header Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-14">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Everything you need to build
              </h2>
              <p className="text-slate-400 max-w-2xl text-sm md:text-base">
                We've integrated every part of the development cycle into a single
                cohesive experience. No more context switching.
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <motion.div className="grid md:grid-cols-3 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerChildren}>
            {[
              { icon: "💬", title: "Contextual Chat", desc: "Discuss code directly in the editor. Mention teammates and resolve issues seamlessly." },
              { icon: "⏳", title: "Time Travel", desc: "Review your project at any point in time. Visualize commit history and merge conflicts." },
              { icon: "🚀", title: "Safe Deploys", desc: "Automated Canary releases and instant rollbacks. Monitor performance and logs in real-time." }
            ].map((feature, i) => (
              <motion.div key={i} className="group bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 p-8 rounded-2xl hover:-translate-y-2 hover:border-blue-500/40 transition-all duration-300 shadow-lg" variants={fadeInUp}>
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 mb-5">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-3 text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <motion.footer className="border-t border-slate-800 bg-[#0B1120]" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400">
          {/* Left Side */}
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="bg-blue-600 p-1.5 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L9 21l-4 1 1-4 10.862-13.513z" />
              </svg>
            </div>
            <span className="text-slate-300 font-medium">DevCollab</span>
          </div>

          {/* Right Links */}
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition">Documentation</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Security</a>
            <a href="#" className="hover:text-white transition">Twitter</a>
          </div>

          <div className="text-center py-4 text-xs text-slate-500">
            © 2026 DevCollab. Built for developers.
          </div>
        </div>
      </motion.footer>
    </div>

    <AnimatePresence>
        {(showLogin || showSignup) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => {
                setShowLogin(false);
                setShowSignup(false);
              } }
            ></div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-50 w-full max-w-md px-4"
            >
              {showLogin && (
  <Login
    isModal={true}
    closeModal={() => setShowLogin(false)}
    openSignup={() => {
      setShowLogin(false);
      setShowSignup(true);
    }}
  />
)}

{showSignup && (
  <Signup
    isModal={true}
    closeModal={() => setShowSignup(false)}
    openLogin={() => {
      setShowSignup(false);
      setShowLogin(true);
    }}
  />
)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}