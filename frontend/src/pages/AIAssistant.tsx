import { useState } from "react";
import { Send, Bot, User, Info, ChevronRight, AlertCircle, MapPin, RotateCcw } from "lucide-react";
import { api } from "../services/api";
import type { ChatMessage } from "../types/api";

const SUGGESTED = [
  "How many records are there?",
  "How many critical records are there?",
  "Show the top 5 highest risk constituencies.",
  "Why is YAVATMAL-WASHIM critical?",
  "Which constituency has the highest cancellation ratio?",
  "Which constituencies have the highest pending work?",
  "Which constituencies have the lowest utilization?",
  "What is the average risk score?",
  "Tell me about Sanjay Uttamrao Deshmukh.",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Namaste. I am the **Satark AI Intelligence Assistant**.\n\n" +
      "I provide factual, data-grounded insights queried directly from the **544 MPLADS parliamentary constituency dataset**.\n\n" +
      "You can ask me about overall risk distributions, parameter outliers (cancellation, pending work, utilization, delays, costs), or why specific constituencies were flagged for review.\n\n" +
      "How can I assist your analysis today?",
    suggestions: [
      "How many records are there?",
      "How many critical records are there?",
      "Show the top 5 highest risk constituencies.",
      "Why is YAVATMAL-WASHIM critical?",
      "Which constituency has the highest cancellation ratio?",
    ],
  },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl bg-white ${className}`}
      style={{
        border: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {children}
    </div>
  );
}

interface AIAssistantProps {
  onNavigate?: (id: string, recordId?: number) => void;
}

export default function AIAssistant({ onNavigate }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text, suggestions: [] };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const response = await api.sendChatMessage(text, historyPayload);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: response.reply,
          suggestions: response.suggestions || [],
          related_constituencies: response.related_constituencies || [],
        },
      ]);
    } catch (err) {
      console.error("Assistant API error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Unable to connect to the MPLADS Intelligence service. Please ensure the FastAPI backend is running at `http://127.0.0.1:8000`.",
          suggestions: [
            "How many records are there?",
            "How many critical records are there?",
            "Show the top 5 highest risk constituencies.",
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="text-[13px] font-bold text-slate-900 mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h5 key={i} className="text-[12px] font-semibold text-slate-800 mt-2 mb-0.5">
            {line.replace("#### ", "")}
          </h5>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <div key={i} className="rounded-r-lg pl-3 py-1.5 my-2" style={{ background: "#EFF6FF", borderLeft: "3px solid #2563EB" }}>
            <p
              className="text-[11px] text-blue-800 italic"
              dangerouslySetInnerHTML={{
                __html: line.replace("> ", "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          </div>
        );
      }
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <div key={i} className="flex items-start gap-1.5 ml-2 mb-1">
            <span className="text-slate-400 text-xs">•</span>
            <span
              className="text-[12px] text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: line.trim().replace(/^[-•]\s*/, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code class='bg-slate-200/80 px-1 py-0.5 rounded text-[11px] font-mono'>$1</code>"),
              }}
            />
          </div>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={i} className="ml-1 mb-1.5">
            <p
              className="text-[12px] text-slate-700 leading-relaxed font-medium"
              dangerouslySetInnerHTML={{
                __html: line.trim().replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return (
        <p
          key={i}
          className="mb-1 text-[12px] text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/`(.+?)`/g, "<code class='bg-slate-200/80 px-1 py-0.5 rounded text-[11px] font-mono'>$1</code>"),
          }}
        />
      );
    });
  }

  return (
    <div className="p-6 flex flex-col space-y-4 max-w-screen-2xl" style={{ height: "calc(100vh - 52px)" }}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Satark AI Intelligence Assistant</h1>
          <p className="text-xs text-slate-500 mt-0.5">Ask questions about MPLADS risks, projects, and anomalies.</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => setMessages(INITIAL_MESSAGES)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw size={11} className="text-slate-400" />
            <span>Clear Chat</span>
          </button>
          <span className="dev-tag">Data Grounded</span>
        </div>
      </div>

      <div
        className="flex items-start gap-2.5 rounded-xl px-4 py-3"
        style={{
          background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
          border: "1px solid rgba(147,197,253,0.5)",
          boxShadow: "0 1px 3px rgba(37,99,235,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <Info size={13} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-800">
          <strong>Decision-Support Disclaimer:</strong> Satark AI answers are strictly grounded in empirical statistical percentiles and pre-trained Isolation Forest anomaly indicators from the 544 MPLADS constituency dataset. All insights must be independently verified by authorized administrative officials.
        </p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chat window */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={
                    msg.role === "assistant"
                      ? { background: "linear-gradient(135deg,#1e4080,#1B3A6B)", boxShadow: "0 2px 8px rgba(27,58,107,0.4)" }
                      : { background: "#F1F5F9", border: "1px solid rgba(226,232,240,0.8)" }
                  }
                >
                  {msg.role === "assistant" ? <Bot size={14} className="text-white" /> : <User size={14} className="text-slate-600" />}
                </div>
                <div className={`flex-1 max-w-[82%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                  <div
                    className="rounded-xl px-4 py-3 text-[12px] leading-relaxed"
                    style={
                      msg.role === "assistant"
                        ? {
                            background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)",
                            border: "1px solid rgba(226,232,240,0.8)",
                            boxShadow: "0 1px 3px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
                          }
                        : {
                            background: "linear-gradient(135deg,#1e4080,#1B3A6B)",
                            boxShadow: "0 2px 8px rgba(27,58,107,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                          }
                    }
                  >
                    {msg.role === "assistant" ? renderContent(msg.content) : <p className="text-white">{msg.content}</p>}
                  </div>

                  {/* Related Constituencies Tags */}
                  {msg.role === "assistant" && msg.related_constituencies && msg.related_constituencies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <MapPin size={10} /> Referenced:
                      </span>
                      {msg.related_constituencies.map((c, ci) => (
                        <button
                          key={ci}
                          onClick={() => sendMessage(`Why was ${c} flagged?`)}
                          className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                          title={`Ask assistant about ${c}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested follow-up prompt pills */}
                  {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((s, si) => (
                        <button
                          key={si}
                          onClick={() => sendMessage(s)}
                          className="flex items-center gap-1 text-[10px] font-semibold rounded-lg px-2.5 py-1 transition-all"
                          style={{
                            background: "#EFF6FF",
                            color: "#1d4ed8",
                            border: "1px solid rgba(147,197,253,0.6)",
                            boxShadow: "0 1px 2px rgba(37,99,235,0.08)",
                          }}
                        >
                          {s} <ChevronRight size={9} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg,#1e4080,#1B3A6B)", boxShadow: "0 2px 8px rgba(27,58,107,0.4)" }}
                >
                  <Bot size={14} className="text-white" />
                </div>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((n) => (
                      <div key={n} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-4">
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "#F8FAFC", border: "1px solid rgba(226,232,240,0.8)", boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)" }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Ask about risks, projects, constituencies, contractors..."
                  className="flex-1 text-xs bg-transparent text-slate-700 placeholder-slate-400 outline-none"
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer"
                style={{
                  background: "linear-gradient(135deg,#1e4080,#1B3A6B)",
                  boxShadow: "0 2px 8px rgba(27,58,107,0.35)",
                  border: "1px solid #1a3870",
                }}
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </Card>

        {/* Suggestions panel */}
        <Card className="w-72 shrink-0 p-4 h-fit">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Suggested Questions</h3>
          <div className="space-y-2">
            {SUGGESTED.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-[11px] text-slate-600 rounded-lg p-2.5 transition-all leading-snug hover:text-blue-700 cursor-pointer"
                style={{ border: "1px solid rgba(226,232,240,0.6)", background: "#F8FAFC", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(147,197,253,0.6)";
                  (e.currentTarget as HTMLElement).style.background = "#EFF6FF";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(226,232,240,0.6)";
                  (e.currentTarget as HTMLElement).style.background = "#F8FAFC";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
