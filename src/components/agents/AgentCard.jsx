import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const statusLabel = { online: "Online", busy: "Busy", offline: "Offline" };

export default function AgentCard({ agent, onOpen }) {
  return (
    <motion.div
      data-testid={`agent-card-${agent.name?.toLowerCase().replace(/\s+/g, "-")}`}
      onClick={() => onOpen(agent)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="agent-card panel p-5 cursor-pointer group"
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <img
            src={agent.avatar_url || "https://static.prod-images.emergentagent.com/jobs/335b4c73-05db-4253-9800-cdf80a7eb6ad/images/5be6bafde2710ced8810a2a4965cb491c85b9642be86c34ad6bacdf6adca6223.png"}
            alt={agent.name}
            className="w-14 h-14 rounded-full object-cover"
            style={{ border: "2px solid #20242C" }}
          />
          <span
            className={`status-dot absolute bottom-0 right-0 status-${agent.status || "online"}`}
            style={{ border: "2px solid #15171C" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-white font-semibold text-base truncate" style={{ fontFamily: "Chivo, sans-serif" }}>
              {agent.name}
            </h3>
            <span className={`risk-${agent.risk_level || "low"} flex-shrink-0`}>
              {agent.risk_level || "low"}
            </span>
          </div>
          <p className="eyebrow mt-0.5 truncate">{agent.role}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="eyebrow mb-1">Status</p>
          <div className="flex items-center gap-1.5">
            <span className={`status-dot status-${agent.status || "online"}`} />
            <span className="text-sm text-slate-300">{statusLabel[agent.status] || "Online"}</span>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-1">Last activity</p>
          <p className="text-sm text-slate-300 truncate">{agent.last_activity || "—"}</p>
        </div>
      </div>

      {/* Current Task */}
      <div className="mb-4">
        <p className="eyebrow mb-1">Current task</p>
        <p className="text-sm text-slate-400 line-clamp-2">{agent.current_task || "No active task"}</p>
      </div>

      {/* CTA */}
      <button
        data-testid={`open-profile-btn-${agent.name?.toLowerCase().replace(/\s+/g, "-")}`}
        onClick={(e) => { e.stopPropagation(); onOpen(agent); }}
        className="flex items-center gap-1.5 text-sm font-medium text-[#00FF66] hover:text-white transition-colors"
      >
        Open profile <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}