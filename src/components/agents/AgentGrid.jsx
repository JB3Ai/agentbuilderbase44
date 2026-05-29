import AgentCard from "./AgentCard";

export default function AgentGrid({ agents, onOpen }) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p className="text-lg font-medium">No agents deployed yet.</p>
        <p className="text-sm mt-1">Click "New Agent" to create your first agent.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} onOpen={onOpen} />
      ))}
    </div>
  );
}