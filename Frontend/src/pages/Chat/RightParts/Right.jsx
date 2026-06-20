import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    MessageSquare,
    Bot,
    Hash,
    Sparkles,
    Terminal,
} from "lucide-react";

import ChatUser from "./ChatUser";
import Messages from "./Messages";
import Typesend from "./Typesend";
import WorkspaceHeader from "./WorkspaceHeader";

import useConversation from "../../../zustand/useConversation.js";

function NoChatSelected() {
    const containerVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.12,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 },
        },
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden select-none">
            {/* GLOW */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[110px] pointer-events-none" />

            <div className="absolute bottom-10 right-10 w-[250px] h-[250px] rounded-full bg-info/5 blur-[90px] pointer-events-none" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-2xl text-center z-10 flex flex-col items-center"
            >
                {/* ICON */}
                <motion.div
                    variants={itemVariants}
                    className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-xl shadow-primary/20 mb-6"
                >
                    <MessageSquare
                        size={38}
                        className="text-white"
                    />

                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-violet-600 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                        <Sparkles
                            size={11}
                            className="text-white animate-pulse"
                        />
                    </span>
                </motion.div>

                {/* TITLE */}
                <motion.h1
                    variants={itemVariants}
                    className="text-3xl font-extrabold text-text-primary tracking-tight mb-3"
                >
                    Welcome to{" "}
                    <span className="bg-gradient-to-r from-primary via-info to-purple-500 bg-clip-text text-transparent">
                        DevCollab Chat
                    </span>
                </motion.h1>

                {/* DESC */}
                <motion.p
                    variants={itemVariants}
                    className="text-sm text-text-secondary max-w-md leading-relaxed mb-10"
                >
                    Real-time conversations,
                    team channels, and
                    repository-aware AI tools
                    all built in one powerful
                    SaaS environment.
                </motion.p>

                {/* FEATURES */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full"
                >
                    <div className="bg-card border border-border-subtle rounded-2xl p-5 text-left hover:border-border-default hover:shadow-md transition-all duration-300 group">
                        <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit mb-3.5 group-hover:scale-105 transition-transform">
                            <Bot size={18} />
                        </div>

                        <h3 className="text-sm font-bold text-text-primary mb-1">
                            AI Integration
                        </h3>

                        <p className="text-xs text-text-muted leading-relaxed">
                            Type{" "}
                            <code className="bg-hover-bg px-1.5 py-0.5 rounded font-mono text-[11px] text-primary">
                                @ai
                            </code>{" "}
                            in any text box.
                        </p>
                    </div>

                    <div className="bg-card border border-border-subtle rounded-2xl p-5 text-left hover:border-border-default hover:shadow-md transition-all duration-300 group">
                        <div className="p-2.5 rounded-xl bg-success-soft text-success w-fit mb-3.5 group-hover:scale-105 transition-transform">
                            <Hash size={18} />
                        </div>

                        <h3 className="text-sm font-bold text-text-primary mb-1">
                            Team Spaces
                        </h3>

                        <p className="text-xs text-text-muted leading-relaxed">
                            Organize projects,
                            tasks and features.
                        </p>
                    </div>

                    <div className="bg-card border border-border-subtle rounded-2xl p-5 text-left hover:border-border-default hover:shadow-md transition-all duration-300 group">
                        <div className="p-2.5 rounded-xl bg-info-soft text-info w-fit mb-3.5 group-hover:scale-105 transition-transform">
                            <Terminal size={18} />
                        </div>

                        <h3 className="text-sm font-bold text-text-primary mb-1">
                            Code Centric
                        </h3>

                        <p className="text-xs text-text-muted leading-relaxed">
                            Share and review code
                            blocks with syntax
                            tools.
                        </p>
                    </div>
                </motion.div>

                {/* STATUS */}
                <motion.div
                    variants={itemVariants}
                    className="mt-10 px-4 py-2 rounded-full border border-border-subtle bg-sidebar flex items-center gap-2 text-xs text-text-secondary"
                >
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />

                    <span>
                        Socket server:
                        Connected & Online
                    </span>
                </motion.div>
            </motion.div>
        </div>
    );
}

function Right() {
    const {
        selectedConversation,
        selectedWorkspace,
    } = useConversation();

    // FIX BUG
    const [showSettings, setShowSettings] =
        useState(false);

    return (
        <section className="flex h-screen w-full flex-col bg-background text-text-primary md:flex-1 overflow-hidden relative">
            {/* WORKSPACE */}
            {selectedWorkspace &&
                !selectedConversation && (
                    <>
                        <WorkspaceHeader
                            workspace={
                                selectedWorkspace
                            }
                        />

                        <div className="flex-1 overflow-y-auto min-h-0">
                            <Messages />
                        </div>

                        {/* HIDE TYPESEND */}
                        {!showSettings && (
                            <Typesend />
                        )}
                    </>
                )}

            {/* DM */}
            {selectedConversation && (
                <>
                    {/* PASS PROPS */}
                    <ChatUser
                        showSettings={
                            showSettings
                        }
                        setShowSettings={
                            setShowSettings
                        }
                    />

                    {/* DIM MESSAGES */}
                    <div
                        className={`flex-1 overflow-y-auto min-h-0 transition-all duration-300 ${showSettings
                                ? "opacity-40 pointer-events-none"
                                : ""
                            }`}
                    >
                        <Messages />
                    </div>

                    {/* FIX BUG */}
                    {!showSettings && (
                        <Typesend />
                    )}
                </>
            )}

            {/* EMPTY */}
            {!selectedConversation &&
                !selectedWorkspace && (
                    <NoChatSelected />
                )}
        </section>
    );
}

export default Right;