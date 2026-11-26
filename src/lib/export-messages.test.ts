import { describe, expect, it } from "vitest";
import type { Tables } from "@/integrations/supabase/types";
import { messagesToCsv } from "./export-messages";

const message: Tables<"messages"> = {
  id: "message-1",
  full_name: "Ama Mensah",
  relationship: "Family",
  message: 'With love, "always"',
  status: "approved",
  created_at: "2026-11-26T10:00:00.000Z",
};

describe("message CSV export", () => {
  it("exports the guest details, approval status, and submission timestamp", () => {
    const csv = messagesToCsv([message]);
    expect(csv).toContain('"Full name","Relationship","Message","Status","Submitted at"');
    expect(csv).toContain('"Ama Mensah","Family","With love, ""always""","approved","2026-11-26T10:00:00.000Z"');
  });

  it("prevents spreadsheet formulas from being executed", () => {
    const csv = messagesToCsv([{ ...message, full_name: "=HYPERLINK(\"https://example.com\")" }]);
    expect(csv).toContain("'=HYPERLINK");
  });
});
