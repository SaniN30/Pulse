import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";

interface OpportunityCardProps {
  type: "warning" | "success" | "experiment";
  title: string;
  description: string;
}

export default function OpportunityCard({
  type,
  title,
  description,
}: OpportunityCardProps) {
  const Icon =
    type === "success"
      ? CheckCircle2
      : type === "experiment"
        ? FlaskConical
        : AlertTriangle;

  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>

      <div>
        <h3 className="font-semibold text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}