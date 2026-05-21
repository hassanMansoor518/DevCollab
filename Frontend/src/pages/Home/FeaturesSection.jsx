import React from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-6 bg-[#0B1120]">
      <div className="max-w-6xl mx-auto">
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

        <motion.div className="grid md:grid-cols-3 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerChildren}>
          {[
            { icon: "💬", title: "Contextual Chat", desc: "Discuss code directly in the editor. Mention teammates and resolve issues seamlessly." },
            { icon: "⏳", title: "Time Travel", desc: "Review your project at any point in time. Visualize commit history and merge conflicts." },
            { icon: "🚀", title: "Safe Deploys", desc: "Automated Canary releases and instant rollbacks. Monitor performance and logs in real-time." },
            { icon: "🔒", title: "Enterprise Security", desc: "Bank-grade encryption, SSO integration, and granular role-based access control." },
            { icon: "⚡", title: "Blazing Fast", desc: "Built on a modern rust-based architecture ensuring zero latency in your workflow." },
            { icon: "📊", title: "Analytics", desc: "Deep insights into team velocity, code quality trends, and deployment frequencies." }
          ].map((feature, i) => (
            <motion.div key={i} className="group bg-gradient-to-br from-[#0F172A] to-[#0B1120] border border-slate-800 p-8 rounded-2xl hover:-translate-y-2 hover:border-blue-500/40 transition-all duration-300 shadow-lg" variants={fadeInUp}>
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 text-2xl mb-6 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-xl mb-3 text-white group-hover:text-blue-400 transition-colors">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
