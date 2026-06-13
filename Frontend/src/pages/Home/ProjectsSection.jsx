import React from "react";
import { motion } from "framer-motion";
import { FaProjectDiagram, FaTasks, FaBug, FaCheckCircle } from "react-icons/fa";

export default function ProjectsSection() {
  return (
    <section id="projects" className="relative py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">

        <motion.div className="lg:w-1/2 space-y-6" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <div className="inline-block bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-purple-200 dark:border-purple-500/20 shadow-sm dark:shadow-none">
            Project Management
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-text-primary leading-tight">
            Manage issues with <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">developer context</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Move beyond generic task trackers. Our project boards understand code, pull requests, and deployment statuses out of the box.
          </p>

          <ul className="space-y-4 mt-8">
            {[
              { icon: <FaTasks className="text-blue-400" />, text: "Auto-sync with GitHub/GitLab issues" },
              { icon: <FaBug className="text-red-400" />, text: "Smart bug routing based on git blame" },
              { icon: <FaCheckCircle className="text-green-400" />, text: "Automated status updates on merge" }
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-4 text-text-secondary bg-surface p-4 rounded-xl border border-border-default">
                <div className="bg-background p-2 rounded-lg border border-border-subtle">{item.icon}</div>
                <span className="font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div className="lg:w-1/2 w-full" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <div className="bg-card border border-border-default rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

            <div className="flex justify-between items-center mb-6 border-b border-border-subtle pb-4">
              <h3 className="text-text-primary font-semibold flex items-center gap-2"><FaProjectDiagram className="text-purple-400" /> Active Sprint</h3>
              <span className="bg-surface border border-border-default text-xs px-3 py-1 rounded-full text-text-secondary">Sprint 42</span>
            </div>

            <div className="space-y-4">
              {/* Task 1 */}
              <div className="bg-surface border border-border-default rounded-xl p-4 flex justify-between items-center hover:border-purple-500/30 transition-colors cursor-pointer">
                <div className="flex gap-4 items-center">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <div>
                    <h4 className="text-sm text-text-primary font-medium">Implement OAuth2</h4>
                    <span className="text-xs text-text-muted">#DEV-102 • In Progress</span>
                  </div>
                </div>
                <img src="https://i.pravatar.cc/100?img=33" alt="User" className="w-8 h-8 rounded-full border-2 border-background" />
              </div>

              {/* Task 2 */}
              <div className="bg-surface border border-border-default rounded-xl p-4 flex justify-between items-center hover:border-purple-500/30 transition-colors cursor-pointer">
                <div className="flex gap-4 items-center">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <div>
                    <h4 className="text-sm text-text-primary font-medium">Database Migration</h4>
                    <span className="text-xs text-text-muted">#DEV-098 • Done</span>
                  </div>
                </div>
                <img src="https://i.pravatar.cc/100?img=12" alt="User" className="w-8 h-8 rounded-full border-2 border-background" />
              </div>

              {/* Task 3 */}
              <div className="bg-surface border border-border-default rounded-xl p-4 flex justify-between items-center hover:border-purple-500/30 transition-colors cursor-pointer">
                <div className="flex gap-4 items-center">
                  <div className="w-2 h-2 rounded-full bg-text-muted"></div>
                  <div>
                    <h4 className="text-sm text-text-primary font-medium">Update API Docs</h4>
                    <span className="text-xs text-text-muted">#DEV-105 • Todo</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-background border-2 border-border-subtle flex items-center justify-center text-xs text-text-muted border-dashed">+</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
