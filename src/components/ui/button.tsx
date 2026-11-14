import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "strong" | "secondary" | "success" | "danger";
export type ButtonSize = "md" | "lg";

const VARIANTES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
  strong: "bg-gradient-to-r from-primary-strong to-primary-hover text-white hover:to-primary shadow-sm",
  secondary: "border border-line bg-surface text-ink hover:bg-canvas",
  success: "bg-success text-white hover:brightness-110 shadow-sm",
  danger: "border border-danger/30 bg-danger-soft text-danger hover:bg-danger/10",
};

const TAMANOS: Record<ButtonSize, string> = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-base",
};

/**
 * Clases de botón reutilizables. Útil para aplicar el mismo estilo a un <Link>.
 */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition",
    "touch-manipulation select-none active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTES[variant],
    TAMANOS[size],
    extra
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}
