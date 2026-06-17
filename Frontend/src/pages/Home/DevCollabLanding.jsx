import React, { useState } from "react";
import { Search, Code2, BookOpen, Bot } from "lucide-react";
import { FaProjectDiagram, FaComments, FaServer, FaCog, FaGithub, FaCode } from "react-icons/fa";
import { AiOutlineRobot } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../auth/Login";
import Signup from "../auth/Signup";
import FeaturesSection from "./FeaturesSection";
import ProjectsSection from "./ProjectsSection";
import TeamsSection from "./TeamsSection";
import AIFeaturesSection from "./AIFeaturesSection";

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


    <div className="relative min-h-screen bg-background text-text-primary">

      {/* ===== BLUR WRAPPER ===== */}
      <div
        className={`${showLogin || showSignup ? "scale-95" : ""} transition-transform duration-300`}
      >

        {/* ================= NAVBAR ================= */}
        <motion.nav
          className="flex items-center justify-between px-4 sm:px-6 md:px-12 py-6 sm:py-8 border-b border-border-default flex-wrap gap-4"
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
        >
          <motion.div className="flex items-center gap-2" variants={fadeInUp}>
            <div className="bg-blue-600 p-2 rounded-md text-white">
              <Code2 size={18} />
            </div>
            <span className="font-semibold text-lg sm:text-xl">DevCollab</span>
          </motion.div>

          <motion.div
            className="hidden md:flex gap-6 sm:gap-8 text-xs sm:text-sm text-text-secondary"
            variants={fadeInUp}
          >
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#projects" className="hover:text-text-primary transition-colors">Projects</a>
            <a href="#teams" className="hover:text-text-primary transition-colors">Teams</a>
            <a href="#ai" className="hover:text-text-primary transition-colors">AI Features</a>
          </motion.div>

          {/* ===== LOGIN + SIGNUP BUTTONS ===== */}
          <motion.div className="flex items-center gap-4" variants={fadeInUp}>
            <button
              className="text-sm text-text-secondary hover:text-text-primary"
              onClick={() => {
                setShowSignup(false);
                setShowLogin(true);

              }}
            >
              Login
            </button>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
              onClick={() => {
                setShowLogin(false);
                setShowSignup(true);

              }}
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
              className="inline-block bg-primary-soft text-primary dark:bg-blue-900/30 dark:text-blue-400 border border-primary/20 dark:border-transparent px-4 py-1.5 rounded-full text-xs mb-6 font-medium shadow-sm"
              variants={fadeInUp}
            >
              🚀 We are now live with AI pair programming
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight"
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
              className="text-text-muted max-w-2xl mx-auto mt-6 text-sm md:text-base"
              variants={fadeInUp}
            >
              The unified workspace for modern engineering teams. Real-time chat,
              project management, and a world-class AI assistant in one unified
              hub.
            </motion.p>

            {/* Buttons */}
            <motion.div className="mt-8 flex flex-col sm:flex-row justify-center gap-4" variants={fadeInUp}>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg w-full sm:w-auto"
                onClick={() => {
                  setShowLogin(true);
                  setShowSignup(false);
                }}
              >
                Get Started Free
              </button>

              <button className="border border-border-default px-6 py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-hover-bg w-full sm:w-auto">
                <BookOpen size={16} />
                Book Demo
              </button>
            </motion.div>
          </motion.div>

          {/* ================= PREVIEW CARD ================= */}
          <motion.div className="mt-20 max-w-6xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerChildren}>
            <motion.div className="bg-card border border-border-default rounded-2xl shadow-[var(--shadow-popover)] overflow-hidden" variants={fadeInUp}>

              {/* ================= TOP BAR ================= */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-border-subtle bg-surface gap-4">
                <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm overflow-x-auto w-full pb-1 sm:pb-0 hide-scrollbar">
                  <span className="text-text-primary font-medium border-b-2 border-primary pb-1 flex items-center gap-1 whitespace-nowrap">
                    <FaProjectDiagram /> Projects
                  </span>
                  <span className="text-text-muted hover:text-text-primary cursor-pointer flex items-center gap-1 whitespace-nowrap">
                    <FaServer /> Pipeline
                  </span>
                  <span className="text-text-muted hover:text-text-primary cursor-pointer flex items-center gap-1 whitespace-nowrap">
                    <FaGithub /> Pull Requests
                  </span>
                </div>

                <span className="text-xs text-green-400 whitespace-nowrap hidden sm:block">● 2 repositories active</span>
              </div>

              {/* ================= CONTENT GRID ================= */}
              <div className="grid grid-cols-12">

                {/* ===== LEFT MINI SIDEBAR ===== */}
                <div className="hidden sm:block col-span-2 border-r border-border-subtle bg-background p-4 flex flex-col justify-between text-xs">

                  {/* Sidebar Menu */}
                  <div className="space-y-3">
                    <div className="bg-primary-soft text-primary px-3 py-2 rounded-md flex items-center gap-2">
                      <FaProjectDiagram /> Projects
                    </div>
                    <div className="text-text-secondary px-3 py-2 rounded-md hover:bg-hover-bg cursor-pointer flex items-center gap-2">
                      <FaComments /> Conversations
                    </div>
                    <div className="text-text-secondary px-3 py-2 rounded-md hover:bg-hover-bg cursor-pointer flex items-center gap-2">
                      <FaCode /> Ai Assistant
                    </div>
                    <div className="text-text-secondary px-3 py-2 rounded-md hover:bg-hover-bg cursor-pointer flex items-center gap-2">
                      <FaCog /> Settings
                    </div>
                  </div>

                  {/* User Login at Bottom */}
                  <div className="mt-6 flex items-center gap-2 px-3 py-2 border-t border-border-subtle">
                    <img
                      src="https://i.pravatar.cc/24?img=12"
                      alt="Alex"
                      className="w-7 h-7 rounded-full" />
                    <div>
                      <span className="text-text-primary text-xs">Hassan Mansoor</span>
                      <div className="text-text-muted text-xs">Developer</div>
                    </div>
                  </div>
                </div>

                {/* ===== MIDDLE SECTION ===== */}
                <div className="col-span-12 sm:col-span-10 lg:col-span-6 p-4 sm:p-6 space-y-6 border-r border-border-subtle">
                  {/* Active Repositories */}
                  <div>
                    <h4 className="text-sm text-text-primary font-semibold mb-4 flex items-center gap-2">
                      <FaGithub /> Active Repositories
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center bg-surface px-4 py-3 rounded-lg border border-border-default">
                        <span className="text-text-secondary flex items-center gap-2">
                          <FaGithub /> core-api-service
                        </span>
                        <span className="bg-success-soft text-success px-2 py-0.5 rounded text-[10px]">
                          STABLE
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-surface px-4 py-3 rounded-lg border border-border-default">
                        <span className="text-text-secondary flex items-center gap-2">
                          <FaGithub /> mobile-client-app
                        </span>
                        <span className="bg-warning-soft text-warning px-2 py-0.5 rounded text-[10px]">
                          BUILDING
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ===== Code Block ===== */}
                  <div className="bg-card rounded-xl border border-border-subtle overflow-hidden shadow-sm">
                    {/* Header Bar */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border-default">
                      <span className="w-3 h-3 bg-error rounded-full"></span>
                      <span className="w-3 h-3 bg-warning rounded-full"></span>
                      <span className="w-3 h-3 bg-success rounded-full"></span>
                      <span className="ml-2 text-xs text-text-muted font-mono">deploy.js</span>
                    </div>
                    {/* Code Content */}
                    <pre className="p-5 font-mono text-xs leading-6 text-text-primary overflow-x-auto">
                      <code>
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-info">deploy</span>{" "}
                        <span className="text-text-primary">=</span>{" "}
                        <span className="text-purple-400">async</span>{" "}
                        <span className="text-text-primary">() {"=> {"}</span>
                        {"\n"}
                        <span className="text-text-muted"> // Initialize deployment layer</span>
                        {"\n"}
                        <span className="text-success">  await build();</span>
                        {"\n"}
                        <span className="text-warning">  console.log('Server initialized');</span>
                        {"\n"}
                        <span className="text-text-primary">{"}"}</span>
                      </code>
                    </pre>
                  </div>
                </div>

                {/* ===== RIGHT AI PANEL ===== */}
                <div className="hidden lg:block col-span-4 p-6 bg-background">
                  <h4 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <AiOutlineRobot /> DevCollab AI
                  </h4>
                  <div className="bg-surface border border-border-subtle rounded-lg p-4 text-xs text-text-secondary mb-6">
                    I see an opportunity to improve your authentication layer.
                    Consider implementing token refresh logic and role validation.
                  </div>
                  <button className="w-full bg-primary hover:bg-primary-hover text-white text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                    <AiOutlineRobot /> Ask DevCollab AI
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>

        </section>

        {/* ================= NEW SECTIONS ================= */}
        <FeaturesSection />
        <ProjectsSection />
        <TeamsSection />
        <AIFeaturesSection />

        {/* ================= FOOTER ================= */}
        <motion.footer className="bg-background border-t border-border-default" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-text-secondary">
            {/* Left Side */}
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="bg-primary p-1.5 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L9 21l-4 1 1-4 10.862-13.513z" />
                </svg>
              </div>
              <span className="text-text-primary font-medium">DevCollab</span>
            </div>

            {/* Right Links */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-4 md:mb-0">
              <a href="#" className="hover:text-text-primary transition">Documentation</a>
              <a href="#" className="hover:text-text-primary transition">Privacy</a>
              <a href="#" className="hover:text-text-primary transition">Security</a>
              <a href="#" className="hover:text-text-primary transition">Twitter</a>
            </div>

            <div className="text-center py-4 text-xs text-text-muted">
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
              }}
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