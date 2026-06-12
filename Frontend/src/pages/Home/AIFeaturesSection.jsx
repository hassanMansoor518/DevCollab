import React from "react";
import { motion } from "framer-motion";
import { AiOutlineRobot, AiOutlineCode, AiOutlineBulb } from "react-icons/ai";

export default function AIFeaturesSection() {
  return (
    <section id="ai" className="relative py-24 px-6 bg-background overflow-hidden">
      <div className="absolute -left-64 top-1/4 w-96 h-96 bg-green-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
        
        <motion.div className="lg:w-1/2 space-y-6 relative z-10" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <div className="inline-block bg-green-900/30 text-green-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-green-500/20">
            DevCollab AI
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-text-primary leading-tight">
            Your personal <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Staff Engineer</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Our context-aware AI doesn't just autocomplete code. It understands your entire repository, architectural patterns, and business logic.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <div className="bg-surface p-5 rounded-2xl border border-border-default hover:border-green-500/30 transition-colors">
              <AiOutlineRobot className="text-3xl text-green-400 mb-4" />
              <h4 className="text-text-primary font-semibold mb-2">Automated Reviews</h4>
              <p className="text-xs text-text-muted leading-relaxed">Get instant feedback on PRs before humans even look at them.</p>
            </div>
            <div className="bg-surface p-5 rounded-2xl border border-border-default hover:border-green-500/30 transition-colors">
              <AiOutlineCode className="text-3xl text-emerald-400 mb-4" />
              <h4 className="text-text-primary font-semibold mb-2">Code Generation</h4>
              <p className="text-xs text-text-muted leading-relaxed">Write boilerplates, tests, and entire modules with a single prompt.</p>
            </div>
            <div className="bg-surface p-5 rounded-2xl border border-border-default hover:border-green-500/30 transition-colors sm:col-span-2 flex items-start gap-4">
              <AiOutlineBulb className="text-4xl text-warning shrink-0 mt-1" />
              <div>
                <h4 className="text-text-primary font-semibold mb-1">Architecture Guidance</h4>
                <p className="text-xs text-text-muted leading-relaxed">Ask architectural questions. "How should we implement role-based access control here?" and get repository-specific answers.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className="lg:w-1/2 w-full relative z-10" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
          <div className="bg-card border border-border-default rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            {/* Fake Editor Header */}
            <div className="bg-surface px-4 py-3 border-b border-border-subtle flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <div className="w-3 h-3 rounded-full bg-success"></div>
              </div>
              <span className="text-xs text-text-muted font-mono flex items-center gap-2"><AiOutlineRobot/> devcollab-ai-chat</span>
            </div>
            
            {/* Chat Content */}
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <img src="https://i.pravatar.cc/100?img=12" alt="User" className="w-8 h-8 rounded-md" />
                <div className="bg-surface px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-text-primary shadow-sm border border-border-default">
                  Can you optimize the fetch query in <code className="text-purple-400 bg-background px-1 py-0.5 rounded">Dashboard.jsx</code>? It's causing re-renders.
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
                  <AiOutlineRobot className="text-white text-lg" />
                </div>
                <div className="bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-text-primary w-full">
                  <p className="mb-3">I found the issue. You're missing a dependency array in the <code className="text-info font-mono">useCallback</code> hook. Here is the optimized code:</p>
                  <pre className="bg-background p-3 rounded-lg border border-border-subtle text-xs font-mono overflow-x-auto text-text-secondary">
<span className="text-purple-400">const</span> fetchData = useCallback(<span className="text-purple-400">async</span> () {"=>"} {"{"}
{"\n  "}<span className="text-purple-400">const</span> res = <span className="text-purple-400">await</span> api.get(<span className="text-success">"/data"</span>);
{"\n  "}setData(res.data);
{"\n"}{"}"}, [<span className="text-warning">api</span>]); <span className="text-text-muted">// Added dependency</span>
                  </pre>
                  <div className="mt-3 flex gap-2">
                    <button className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/30 transition-colors font-medium">Apply Fix</button>
                    <button className="text-xs border border-border-default px-3 py-1.5 rounded hover:bg-hover-bg transition-colors text-text-primary">Explain</button>
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
