import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon?: IconName;
  hint?: ReactNode;
  inputClassName?: string;
}

/** Campo de formulario: etiqueta + input gris claro con icono opcional. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { id, label, icon, hint, className, inputClassName, ...props },
  ref
) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-md border border-line bg-field py-2.5 pr-3 text-base text-ink placeholder:text-ink-soft",
            "focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20",
            icon ? "pl-9" : "pl-3",
            inputClassName
          )}
          {...props}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
});
