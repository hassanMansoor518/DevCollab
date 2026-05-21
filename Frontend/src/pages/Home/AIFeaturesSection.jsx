import React from "react";
import { motion } from "framer-motion";
import { AiOutlineRobot, AiOutlineCode, AiOutlineBulb } from "react-icons/ai";

export default function AIFeaturesSection() {
  return (
    <section id="ai" className="relative py-24 px-6 bg-[#0B1120] overflow-hidden">
      <div className="absolute -left-64 top-1/4 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
        
        <motion.div className="lg:w-1/2 space-y-6 relative z-10" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <div className="inline-block bg-green-900/30 text-green-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-green-500/20">
            DevCollab AI
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            Your personal <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Staff Engineer</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Our context-aware AI doesn't just autocomplete code. It understands your entire repository, architectural patterns, and business logic.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 hover:border-green-500/30 transition-colors">
              <AiOutlineRobot className="text-3xl text-green-400 mb-4" />
              <h4 className="text-white font-semibold mb-2">Automated Reviews</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Get instant feedback on PRs before humans even look at them.</p>
            </div>
            <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 hover:border-green-500/30 transition-colors">
              <AiOutlineCode className="text-3xl text-emerald-400 mb-4" />
              <h4 className="text-white font-semibold mb-2">Code Generation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Write boilerplates, tests, and entire modules with a single prompt.</p>
            </div>
            <div className="bg-[#111827] p-5 rounded-2xl border border-slate-800 hover:border-green-500/30 transition-colors sm:col-span-2 flex items-start gap-4">
              <AiOutlineBulb className="text-4xl text-yellow-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-white font-semibold mb-1">Architecture Guidance</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Ask architectural questions. "How should we implement role-based access control here?" and get repository-specific answers.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className="lg:w-1/2 w-full relative z-10" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            {/* Fake Editor Header */}
            <div className="bg-[#111827] px-4 py-3 border-b border-slate-800 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-2"><AiOutlineRobot/> devcollab-ai-chat</span>
            </div>
            
            {/* Chat Content */}
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <img src="https://i.pravatar.cc/100?img=12" alt="User" className="w-8 h-8 rounded-md" />
                <div className="bg-[#1E293B] px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-300 shadow-sm">
                  Can you optimize the fetch query in <code className="text-purple-400 bg-black/20 px-1 py-0.5 rounded">Dashboard.jsx</code>? It's causing re-renders.
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
                  <AiOutlineRobot className="text-white text-lg" />
                </div>
                <div className="bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-300 w-full">
                  <p className="mb-3">I found the issue. You're missing a dependency array in the <code className="text-blue-400 font-mono">useCallback</code> hook. Here is the optimized code:</p>
                  <pre className="bg-[#0B1120] p-3 rounded-lg border border-slate-800 text-xs font-mono overflow-x-auto text-slate-300">
<span className="text-purple-400">const</span> fetchData = useCallback(<span className="text-purple-400">async</span> () {"=>"} {"{"}
{"\n  "}<span className="text-purple-400">const</span> res = <span className="text-purple-400">await</span> api.get(<span className="text-green-400">"/data"</span>);
{"\n  "}setData(res.data);
{"\n"}{"}"}, [<span className="text-yellow-400">api</span>]); <span className="text-slate-500">// Added dependency</span>
                  </pre>
                  <div className="mt-3 flex gap-2">
                    <button className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/30 transition-colors font-medium">Apply Fix</button>
                    <button className="text-xs border border-slate-700 px-3 py-1.5 rounded hover:bg-slate-800 transition-colors">Explain</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
