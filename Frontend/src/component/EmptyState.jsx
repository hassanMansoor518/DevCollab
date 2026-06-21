import React from "react";
import { motion } from "framer-motion";

/**
 * EmptyState — Premium SaaS-quality empty state component.
 *
 * Props:
 *  icon        React element (Lucide icon) — rendered inside the icon container
 *  title       Short heading text
 *  description Explanatory sentence
 *  action      { label, onClick } — optional primary CTA
 *  minHeight   Tailwind min-h class, defaults to "min-h-[360px]"
 *  iconTone    Tailwind classes for icon bg + text color, defaults to primary-soft/primary
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  minHeight = "min-h-[360px]",
  iconTone = "bg-primary-soft text-primary",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex ${minHeight} w-full flex-col items-center justify-center px-6 py-12 text-center`}
    >
      {/* Icon Container */}
      <div
        className={`mb-5 flex h-18 w-18 items-center justify-center rounded-2xl border border-border-subtle ${iconTone} shadow-sm`}
      >
        {icon}
      </div>

      {/* Heading */}
      <h3 className="text-xl font-semibold text-text-primary">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-text-muted">
          {description}
        </p>
      )}

      {/* Optional CTA */}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
