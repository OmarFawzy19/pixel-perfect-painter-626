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
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl glass p-6 md:p-8"
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-primary opacity-20 blur-3xl transition-opacity group-hover:opacity-40" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{tag}</span>
        </div>
        <h3 className="mt-5 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {steps && (
          <ol className="mt-5 space-y-2">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        )}
        {metric && (
          <div className="mt-6 rounded-xl bg-background/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{metric.label}</p>
            <p className="font-display text-3xl font-bold text-gradient">{metric.value}</p>
          </div>
        )}
      </div>
    </motion.article>
  );
}
