// Work Report (WorkOrder) — status, labels aur "agla qadam" logic ek jagah.
// DB values backend ke hain (purane naam), sirf labels naye flow ke mutabiq hain.

export const STATUS_OPTIONS = [
  { value: "pending_sample", label: "Shuru nahi hua" },
  { value: "in_progress", label: "Kaam jari hai" },
  { value: "in_review", label: "Client ke jawab ka intezar" },
  { value: "rework_required", label: "Dobara kaam chahiye" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Mukammal" },
  { value: "cancelled", label: "Cancelled" },
];

export const STATUS_COLOR = {
  pending_sample: "default",
  in_progress: "processing",
  in_review: "warning",
  rework_required: "error",
  approved: "success",
  completed: "success",
  cancelled: "default",
};

export const RESPONSE_LABEL = { pending: "Intezar", approved: "Approved", rejected: "Rejected" };

export const CAUSED_BY_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "company", label: "Hamari taraf se" },
  { value: "material", label: "Material" },
  { value: "weather", label: "Mausam" },
  { value: "other", label: "Other" },
];

// Ready-made wajah — tap karo to text mein aa jaye.
export const REASON_CHIPS = [
  "Client ne material late diya",
  "Site tayyar nahi thi",
  "Design change hua",
  "Payment ruki hui hai",
  "Bijli / pani nahi tha",
  "Mausam kharab tha",
];

export const MAX_ISSUE_IMAGES = 5;

// ─── Client ko jane wali PDF report — aasan English ──────────────
export const STATUS_LABEL_EN = {
  pending_sample: "Not started",
  in_progress: "Work in progress",
  in_review: "Waiting for client approval",
  rework_required: "Rework required",
  approved: "Approved by client",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const RESPONSE_LABEL_EN = { pending: "Waiting", approved: "Approved", rejected: "Rejected" };

export const CAUSED_BY_LABEL_EN = {
  client: "Client",
  company: "Our side",
  material: "Material",
  weather: "Weather",
  other: "Other",
};

export const daysTextEn = (days) => {
  if (days === null || days === undefined) return "—";
  if (days === 0) return "Same day";
  return `${days} day${days === 1 ? "" : "s"}`;
};
// Round 1 = asal kaam, Round 2 = Rework #1, Round 3 = Rework #2 …
export const roundLabel = (roundNumber) => (roundNumber > 1 ? `Rework #${roundNumber - 1}` : "Pehla Round");

export const labelOf =(opts, v) => opts.find((o) => o.value === v)?.label || v || "—";

export const daysText = (days) => {
  if (days === null || days === undefined) return "—";
  if (days === 0) return "Usi din";
  return `${days} din`;
};

/**
 * Aakhri round aur status dekh kar batao user ka agla qadam kya hai.
 * Returns one of: "cancelled" | "start" | "in_progress" | "await_response" | "rework" | "approved"
 */
export const getNextStep = (workOrder, rounds = []) => {
  if (!workOrder) return null;
  if (workOrder.status === "cancelled") return "cancelled";
  const latest = rounds[rounds.length - 1];
  if (!latest) return "start";
  if (latest.responseStatus === "approved") return "approved";
  if (latest.responseStatus === "rejected") return "rework";
  if (latest.sampleReadyDate) return "await_response";
  return "in_progress";
};
