import React from "react";
import { motion } from "framer-motion";
import { FaUsers, FaVideo, FaShareAlt } from "react-icons/fa";

export default function TeamsSection() {
  return (
    <section id="teams" className="relative py-24 px-6 bg-[#0B1120] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto text-center mb-16 relative z-10">
        <div className="inline-block bg-blue-900/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-500/20 mb-6">
          Team Collaboration
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Built for distributed <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">engineering teams</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Synchronize your team's workflow with built-in multiplayer editing, integrated video calls, and instant knowledge sharing.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
        {[
          { icon: <FaUsers size={24} />, title: "Real-time Presence", desc: "See who is viewing which file, typing, or debugging in real-time. Never step on each other's toes again." },
          { icon: <FaVideo size={24} />, title: "Huddles & Screen Share", desc: "Instantly jump into a quick voice or video huddle from any line of code or project board." },
          { icon: <FaShareAlt size={24} />, title: "Knowledge Base", desc: "Auto-generated team wikis based on your codebase, PR discussions, and architecture decisions." }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            className="bg-[#0F172A] border border-slate-800 p-8 rounded-3xl relative overflow-hidden group"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 bg-[#111827] border border-slate-700 rounded-2xl flex items-center justify-center text-blue-400 mb-6 shadow-inner">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Team avatars display */}
      <motion.div
        className="max-w-3xl mx-auto mt-16 p-6 bg-[#0F172A] border border-slate-800 rounded-full flex items-center justify-between"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center">
          <div className="flex -space-x-4 mr-6">
            {[1, 2, 3, 4, 5].map(num => (
              <img key={num} src={`https://i.pravatar.cc/100?img=${num * 10}`} alt="Team member" className="w-12 h-12 rounded-full border-4 border-[#0F172A]" />
            ))}
            <div className="w-12 h-12 rounded-full border-4 border-[#0F172A] bg-slate-800 flex items-center justify-center text-white font-medium text-xs z-10">+12</div>
          </div>
          <div className="hidden md:block">
            <h4 className="text-white font-medium">Join 10,000+ teams</h4>
            <p className="text-xs text-slate-400">Collaborating globally</p>
          </div>
        </div>
        <button className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-slate-200 transition-colors shadow-lg">
          Invite Your Team
        </button>
      </motion.div>
    </section>
  );
}
