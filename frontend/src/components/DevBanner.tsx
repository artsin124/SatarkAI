import { FlaskConical } from "lucide-react";

interface DevBannerProps {
  feature: string;
  eta?: string;
  partial?: boolean;
}

export default function DevBanner({ feature, eta, partial = false }: DevBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border px-4 py-3"
      style={{
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        borderColor: "#d97706",
        boxShadow: "0 1px 3px rgba(217,119,6,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <div className="mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0"
        style={{ background: "#d97706", boxShadow: "0 2px 4px rgba(217,119,6,0.35)" }}>
        <FlaskConical size={13} className="text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider font-mono">
            {partial ? "Partial Implementation" : "Feature in Development"}
          </span>
          <span className="dev-tag">Beta</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-snug">
          <strong>{feature}</strong>
          {eta && <span className="text-amber-700"> — Planned for {eta}</span>}
        </p>
      </div>
    </div>
  );
}
