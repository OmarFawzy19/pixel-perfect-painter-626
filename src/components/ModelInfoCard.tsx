import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

export function ModelInfoCard({
  icon: Icon,
  tag,
  title,
  description,
  steps,
  metric,
  index = 0,
}: {
  icon: LucideIcon;
  tag: string;
  title: string;
  description: string;
  steps?: string[];
  metric?: { label: string; value: string };
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-glow md:p-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-primary opacity-15 blur-3xl transition-opacity duration-300 group-hover:opacity-35" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary shadow-glow transition-shadow group-hover:shadow-lg">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </span>
          <span className="rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs font-semibold text-secondary-foreground backdrop-blur-sm">
            {tag}
          </span>
        </div>

        <h3 className="mt-6 text-2xl font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{description}</p>

        {steps && (
          <ol className="mt-6 space-y-2.5 border-t border-border/40 pt-5">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm text-foreground/90">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/80 text-xs font-bold text-accent-foreground border border-border/40">
                  {i + 1}
                </span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {metric && (
        <div className="relative mt-6 rounded-2xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-gradient">{metric.value}</p>
        </div>
      )}
    </motion.article>
  );
}
