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
  // Calm Saffron (D-071): icon tile + title on one row, the eyebrow kept as a
  // quiet label (it doubles as a breadcrumb), body-size description.
  return (
    <header className={cn("mb-6 md:mb-8", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className={cn("text-[14px] font-bold text-primary", eyebrowClassName)}>
            {eyebrow}
          </p>
          <div className="flex items-center gap-3">
            {icon && (
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-primary", iconClassName)}>
                {icon}
              </span>
            )}
            <h1 className="font-display text-[28px] font-extrabold leading-tight text-heading md:text-[36px]">
              {title}
            </h1>
          </div>
          {description && (
            <p className={cn("max-w-2xl text-base leading-relaxed text-muted-foreground", descriptionClassName)}>
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
