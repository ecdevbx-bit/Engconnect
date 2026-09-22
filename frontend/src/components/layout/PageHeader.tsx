import { cn } from "@/lib/utils";

/**
 * PageHeader — the top of every content page (Layout.md §2).
 * Four stacked elements: optional icon badge, eyebrow (doubles as breadcrumb),
 * display title, description. Optional right-aligned action slot.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  action,
  className,
  descriptionClassName,
  eyebrowClassName,
  iconClassName,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  descriptionClassName?: string;
  eyebrowClassName?: string;
  iconClassName?: string;
}) {
  return (
    <header className={cn("mb-8 md:mb-10", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          {icon && (
            <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary", iconClassName)}>
              {icon}
            </span>
          )}
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.22em] text-primary", eyebrowClassName)}>
            {eyebrow}
          </p>
          <h1 className="font-display font-bold leading-[1.05] text-heading text-[clamp(2rem,4.5vw,3.25rem)]">
            {title}
          </h1>
          {description && (
            <p className={cn("max-w-2xl text-sm leading-relaxed text-muted-foreground", descriptionClassName)}>
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
