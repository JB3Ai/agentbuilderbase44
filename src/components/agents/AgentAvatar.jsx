import { useState } from "react";

export default function AgentAvatar({ name, avatarUrl, size = "md", className = "", style = {} }) {
  const [failed, setFailed] = useState(false);

  const sizes = {
    sm: { box: "w-8 h-8", text: "text-xs", radius: "rounded-lg" },
    md: { box: "w-14 h-14", text: "text-base", radius: "rounded-xl" },
    lg: { box: "w-24 h-24", text: "text-2xl", radius: "rounded-xl" },
    xl: { box: "w-10 h-10", text: "text-sm", radius: "rounded-full" },
  };

  const s = sizes[size] || sizes.md;

  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Pick a consistent color from the name
  const colors = [
    ["#00FF66", "#06140B"],
    ["#60A5FA", "#0A1628"],
    ["#F59E0B", "#1A1200"],
    ["#A78BFA", "#130D28"],
    ["#F472B6", "#1F0615"],
    ["#34D399", "#041A10"],
    ["#FB923C", "#1F0A00"],
    ["#38BDF8", "#021422"],
  ];
  const idx = (name || "").charCodeAt(0) % colors.length;
  const [fg, bg] = colors[idx];

  if (!failed && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${s.box} ${s.radius} object-cover ${className}`}
        style={{ border: "2px solid #20242C", flexShrink: 0, ...style }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${s.box} ${s.radius} flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{ background: bg, border: `2px solid ${fg}33`, color: fg, fontFamily: "Chivo, sans-serif", ...style }}
    >
      <span className={s.text}>{initials}</span>
    </div>
  );
}