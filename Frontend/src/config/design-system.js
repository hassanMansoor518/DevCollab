export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const buttonVariants = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-50 focus-visible:outline-none",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-border-default bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-hover-bg disabled:opacity-50 focus-visible:outline-none",
  tertiary:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-hover-bg hover:text-text-primary disabled:opacity-50 focus-visible:outline-none",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 focus-visible:outline-none",
  success:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 focus-visible:outline-none",
};

export const buttonSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10",
  lg: "h-11 px-5 text-base",
  icon: "h-9 w-9 px-0",
};

export const getButtonClass = (variant = "primary", size = "md", disabled = false) =>
  cn(
    buttonVariants[variant] || buttonVariants.primary,
    buttonSizes[size] || buttonSizes.md,
    "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    disabled && "cursor-not-allowed"
  );

export const getInputClass = (error = false, disabled = false, size = "md") => {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "min-h-10 px-3.5 py-2 text-sm",
    lg: "min-h-11 px-4 py-2.5 text-base",
  };

  return cn(
    "w-full rounded-lg border bg-input-bg text-text-primary placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15",
    sizes[size] || sizes.md,
    error ? "border-error focus:border-error focus:ring-error/15" : "border-border-default",
    disabled && "cursor-not-allowed opacity-50"
  );
};

export const getCardClass = (elevated = false, interactive = false) =>
  cn(
    "rounded-xl border border-border-subtle bg-card transition",
    elevated ? "shadow-[var(--shadow-soft)]" : "shadow-sm",
    interactive && "cursor-pointer hover:-translate-y-0.5 hover:border-border-default hover:shadow-[var(--shadow-soft)]"
  );

export const badgeVariants = {
  primary: "border-primary/25 bg-primary-soft text-primary",
  success: "border-success/25 bg-success-soft text-success",
  warning: "border-warning/25 bg-warning-soft text-warning",
  error: "border-error/25 bg-error-soft text-error",
  info: "border-info/25 bg-info-soft text-info",
  neutral: "border-border-default bg-hover-bg text-text-secondary",
};

export const layout = {
  page: "mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7",
  section: "space-y-6",
  gridCards: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
  gridTwo: "grid grid-cols-1 gap-5 xl:grid-cols-2",
};
