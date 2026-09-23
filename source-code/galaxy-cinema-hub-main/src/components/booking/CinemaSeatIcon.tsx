import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

interface CinemaSeatIconProps {
  status: "available" | "held" | "sold" | "maintenance" | "selected";
  type?: "standard" | "vip" | "couple";
  isMerged?: boolean;
  isSelected?: boolean;
  seatNumber?: string | number;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}

export const CinemaSeatIcon: React.FC<CinemaSeatIconProps> = ({
  status,
  type = "standard",
  isMerged = false,
  isSelected = false,
  seatNumber,
  onClick,
  title,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const isSold = status === "sold" || status === "maintenance";
  const isHeld = status === "held" && !isSelected;

  const width = isMerged ? 94 : 42;
  const height = 36;

  // Adaptive Fill & Stroke based on Theme and Seat Type
  let backFill = isLight ? "url(#standardBackGradLight)" : "url(#standardBackGradDark)";
  let cushionFill = isLight ? "url(#standardCushionGradLight)" : "url(#standardCushionGradDark)";
  let strokeColor = isLight ? "#94a3b8" : "#475569";
  let armFill = isLight ? "#cbd5e1" : "#334155";
  let armStroke = isLight ? "#94a3b8" : "#475569";

  if (isSold) {
    backFill = isLight ? "#f1f5f9" : "#131822";
    cushionFill = isLight ? "#e2e8f0" : "#0c1017";
    strokeColor = isLight ? "#cbd5e1" : "#1e2736";
    armFill = isLight ? "#f1f5f9" : "#131822";
    armStroke = isLight ? "#e2e8f0" : "#1a2230";
  } else if (isHeld) {
    backFill = "url(#heldBackGrad)";
    cushionFill = "url(#heldCushionGrad)";
    strokeColor = "#d97706";
    armFill = isLight ? "#f59e0b" : "#78350f";
    armStroke = isLight ? "#d97706" : "#b45309";
  } else if (isSelected) {
    backFill = "url(#selectedBackGrad)";
    cushionFill = "url(#selectedCushionGrad)";
    strokeColor = isLight ? "#0284c7" : "#bae6fd";
    armFill = "#0284c7";
    armStroke = isLight ? "#0369a1" : "#7dd3fc";
  } else if (type === "vip") {
    backFill = isLight ? "url(#vipBackGradLight)" : "url(#vipBackGradDark)";
    cushionFill = isLight ? "url(#vipCushionGradLight)" : "url(#vipCushionGradDark)";
    strokeColor = isLight ? "#7e22ce" : "#c084fc";
    armFill = isLight ? "#9333ea" : "#7c3aed";
    armStroke = isLight ? "#7e22ce" : "#a855f7";
  } else if (type === "couple") {
    backFill = isLight ? "url(#coupleBackGradLight)" : "url(#coupleBackGradDark)";
    cushionFill = isLight ? "url(#coupleCushionGradLight)" : "url(#coupleCushionGradDark)";
    strokeColor = isLight ? "#be123c" : "#fda4af";
    armFill = isLight ? "#f43f5e" : "#e11d48";
    armStroke = isLight ? "#be123c" : "#fb7185";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSold || (isHeld && !isSelected)}
      title={title}
      className={cn(
        "group relative flex flex-col items-center justify-center p-0.5 transition-all duration-200 outline-none focus:outline-none select-none",
        !disabled && !isSold && "hover:scale-115 hover:-translate-y-1 active:scale-95 cursor-pointer z-10 hover:z-20",
        isSold && "cursor-not-allowed opacity-30 saturate-50",
      )}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Selected Pulsing Halo */}
      {isSelected && (
        <span className="absolute -inset-1 rounded-2xl bg-sky-400/25 blur-sm animate-pulse pointer-events-none" />
      )}

      {/* SVG Cinema Armchair */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "transition-all duration-300 drop-shadow-sm",
          isSelected && "filter drop-shadow-[0_0_12px_rgba(56,189,248,0.95)]",
          !isSelected && type === "vip" && "filter drop-shadow-[0_0_8px_rgba(168,85,247,0.55)]",
          !isSelected && type === "couple" && "filter drop-shadow-[0_0_8px_rgba(244,63,94,0.55)]",
          !isSelected && !isSold && "group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]",
        )}
      >
        <defs>
          {/* Standard Gradients (Dark & Light) */}
          <linearGradient id="standardBackGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b4a60" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="standardCushionGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a374a" />
            <stop offset="100%" stopColor="#16202e" />
          </linearGradient>
          <linearGradient id="standardBackGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="standardCushionGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* VIP Gradients (Dark & Light) */}
          <linearGradient id="vipBackGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>
          <linearGradient id="vipCushionGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>
          <linearGradient id="vipBackGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
          <linearGradient id="vipCushionGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>

          {/* Couple Gradients (Dark & Light) */}
          <linearGradient id="coupleBackGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id="coupleCushionGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
          <linearGradient id="coupleBackGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
          <linearGradient id="coupleCushionGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          {/* Selected Gradients */}
          <linearGradient id="selectedBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="selectedCushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Held Gradients */}
          <linearGradient id="heldBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="heldCushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>

        {isMerged ? (
          /* Couple Seat / Sweetbox Double Armchair */
          <g>
            {/* Double Backrest */}
            <rect
              x="4"
              y="2"
              width="86"
              height="12"
              rx="6"
              fill={backFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            {/* Subtle Top Specular Line */}
            <path
              d="M 12 4 Q 47 3 82 4"
              stroke={isLight ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.3)"}
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Double Cushion */}
            <rect
              x="6"
              y="16"
              width="82"
              height="17"
              rx="5"
              fill={cushionFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            {/* Center Divider Groove */}
            <line
              x1="47"
              y1="17"
              x2="47"
              y2="32"
              stroke={strokeColor}
              strokeWidth="1"
              strokeDasharray="2 1"
              opacity="0.6"
            />
            {/* Left Armrest */}
            <rect
              x="1"
              y="10"
              width="4"
              height="22"
              rx="2"
              fill={armFill}
              stroke={armStroke}
              strokeWidth="1"
            />
            {/* Right Armrest */}
            <rect
              x="89"
              y="10"
              width="4"
              height="22"
              rx="2"
              fill={armFill}
              stroke={armStroke}
              strokeWidth="1"
            />
          </g>
        ) : (
          /* Single Ergonomic Cinema Armchair */
          <g>
            {/* Backrest (Tựa lưng bo vòm công thái học) */}
            <rect
              x="5"
              y="2"
              width="32"
              height="12"
              rx="5.5"
              fill={backFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            {/* Subtle Headrest Specular Highlight */}
            <path
              d="M 10 4.5 Q 21 3.5 32 4.5"
              stroke={isLight ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.28)"}
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Cushion (Đệm ngồi dày êm ái) */}
            <rect
              x="6"
              y="16"
              width="30"
              height="17"
              rx="4.5"
              fill={cushionFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />
            {/* Left Armrest */}
            <rect
              x="1.5"
              y="9"
              width="3.5"
              height="23"
              rx="1.75"
              fill={armFill}
              stroke={armStroke}
              strokeWidth="0.9"
            />
            {/* Right Armrest */}
            <rect
              x="37"
              y="9"
              width="3.5"
              height="23"
              rx="1.75"
              fill={armFill}
              stroke={armStroke}
              strokeWidth="0.9"
            />
          </g>
        )}

        {/* Sold indicator slash */}
        {isSold && (
          <g opacity={isLight ? "0.45" : "0.6"}>
            <line
              x1={isMerged ? "38" : "15"}
              y1="10"
              x2={isMerged ? "56" : "27"}
              y2="28"
              stroke={isLight ? "#94a3b8" : "#64748b"}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <line
              x1={isMerged ? "56" : "27"}
              y1="10"
              x2={isMerged ? "38" : "15"}
              y2="28"
              stroke={isLight ? "#94a3b8" : "#64748b"}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>

      {/* Seat Number */}
      {!isSold && (
        <span
          className={cn(
            "absolute text-[11px] font-black pointer-events-none transition-all tracking-tight select-none",
            isSelected
              ? "text-white font-extrabold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] scale-110"
              : type === "vip"
                ? "text-purple-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                : type === "couple"
                  ? "text-rose-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  : isLight
                    ? "text-slate-800 font-extrabold"
                    : "text-zinc-200 font-bold",
          )}
          style={{ top: "17px" }}
        >
          {seatNumber}
        </span>
      )}
    </button>
  );
};

export default CinemaSeatIcon;
