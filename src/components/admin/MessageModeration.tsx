import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Download, RotateCcw, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteMessage, setMessageStatus } from "@/lib/admin.functions";
import type { Tables } from "@/integrations/supabase/types";
import { messagesToCsv } from "@/lib/export-messages";

type Message = Tables<"messages">;
type Filter = "pending" | "approved" | "rejected" | "all";

const filters: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Not shown" },
  { value: "all", label: "All" },
];

export function MessageModeration({ messages }: { messages: Message[] }) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const setStatus = useServerFn(setMessageStatus);
  const remove = useServerFn(deleteMessage);
  const visible = messages.filter((message) => {
    const matchesStatus = filter === "all" || message.status === filter;
    const matchesSearch = message.full_name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const exportCsv = () => {
    const blob = new Blob([messagesToCsv(messages)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agnes-60-messages-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Messages exported");
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    await queryClient.invalidateQueries({ queryKey: ["approved-messages"] });
  };

  const moderate = async (id: string, status: Message["status"]) => {
    setBusyId(id);
    try {
      await setStatus({ data: { id, status } });
      await refresh();
      toast.success(status === "approved" ? "Message published on the invitation" : status === "rejected" ? "Message hidden from the invitation" : "Message returned to pending");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The message could not be updated");
    } finally {
      setBusyId(null);
    }
  };

  const deleteOne = async (id: string) => {
    if (!window.confirm("Permanently delete this personal message?")) return;
    setBusyId(id);
    try {
      await remove({ data: { id } });
      await refresh();
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The message could not be deleted");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search messages by guest name</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by guest name"
            className="w-full border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </label>
        <button type="button" onClick={exportCsv} disabled={!messages.length} className="inline-flex items-center justify-center gap-2 border border-gold bg-card px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] hover:bg-gold hover:text-primary-foreground disabled:opacity-50">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-5">
        {filters.map((item) => {
          const count = item.value === "all" ? messages.length : messages.filter((message) => message.status === item.value).length;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${filter === item.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              {item.label} · {count}
            </button>
          );
        })}
      </div>

      {visible.length ? (
        <div className="mt-6 space-y-5">
          {visible.map((message) => (
            <article key={message.id} className="border border-border bg-card p-6 md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl">{message.full_name}</h2>
                    <span className="eyebrow text-gold">{message.status === "rejected" ? "Not shown" : message.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.relationship || "Relationship not specified"} · {new Date(message.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.status !== "approved" && (
                    <button type="button" disabled={busyId === message.id} onClick={() => void moderate(message.id, "approved")} className="inline-flex items-center gap-2 border border-gold px-4 py-2 text-xs hover:bg-gold hover:text-primary-foreground disabled:opacity-50">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                  )}
                  {message.status !== "rejected" && (
                    <button type="button" disabled={busyId === message.id} onClick={() => void moderate(message.id, "rejected")} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs hover:bg-secondary disabled:opacity-50">
                      <X className="h-4 w-4" /> Hide
                    </button>
                  )}
                  {message.status !== "pending" && (
                    <button type="button" disabled={busyId === message.id} onClick={() => void moderate(message.id, "pending")} aria-label="Return to pending" className="border border-border p-2 text-muted-foreground hover:text-foreground disabled:opacity-50">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" disabled={busyId === message.id} onClick={() => void deleteOne(message.id)} aria-label={`Delete message from ${message.full_name}`} className="border border-border p-2 text-muted-foreground hover:text-destructive disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-5 whitespace-pre-line font-display text-xl italic leading-relaxed text-foreground/85">“{message.message}”</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-gold/50 px-6 py-20 text-center">
          <p className="font-display text-3xl">No {filter === "all" ? "" : filter} messages</p>
          <p className="mt-3 text-sm text-muted-foreground">New guest messages will appear here for your review.</p>
        </div>
      )}
    </div>
  );
}
