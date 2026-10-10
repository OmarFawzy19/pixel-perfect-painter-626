import { FlaskConical } from "lucide-react";
import { IS_DEMO } from "@/lib/api";

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  if (!IS_DEMO) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p className="text-muted-foreground">
        <span className="font-semibold text-gold">Demo Mode.</span>{" "}
        {children ?? "No recommendation API is connected, so these results come from a small sample catalog — they are not predictions from the trained models."}
      </p>
    </div>
  );
}
