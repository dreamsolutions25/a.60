import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;

function csvCell(value: string | null) {
  let text = value ?? "";
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function messagesToCsv(messages: Message[]) {
  const rows = messages.map((message) =>
    [message.full_name, message.relationship, message.message, message.status, message.created_at].map(csvCell).join(","),
  );
  return `\uFEFF${["Full name", "Relationship", "Message", "Status", "Submitted at"].map(csvCell).join(",")}\r\n${rows.join("\r\n")}`;
}
