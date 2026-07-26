// Catalyst Serverless Function — Natural Language → structured query (Module 6)
// Real LLM intent parsing via GROQ (server-side; key never leaves the server),
// then runs the parsed filter against the real case database.

import { queryCasesData } from "./casesAndTrends";

export interface ParsedIntent {
  crime_type: string | null;
  district: string | null;
  status: string | null;
  keywords: string[];
  language_detected: string;
  transliteration?: string | null;
}

const CRIME_TYPES = [
  "Burglary & Theft",
  "Vehicle Theft",
  "Cyber & UPI Fraud",
  "Harassment & Assault",
  "Robbery",
  "Chain Snatching"
];
const DISTRICTS = ["Bengaluru Urban", "Bengaluru City", "Mysuru", "Dakshina Kannada", "Hubballi-Dharwad", "Belagavi", "Shivamogga"];
const STATUSES = ["UNRESOLVED", "INVESTIGATING", "RESOLVED", "CHARGESHEETED"];

const SYSTEM_PROMPT = `You are an intent parser for a police case-search system in Karnataka, India.
Convert the user's natural-language query (which may be English, Kannada, or Kannada transliterated into Latin script) into a STRICT JSON object and NOTHING else.

Schema:
{
  "crime_type": one of [${CRIME_TYPES.map((c) => `"${c}"`).join(", ")}] or null,
  "district": one of [${DISTRICTS.map((d) => `"${d}"`).join(", ")}] or null,
  "status": one of [${STATUSES.map((s) => `"${s}"`).join(", ")}] or null,
  "keywords": array of lowercase salient terms (may be empty),
  "language_detected": "English" | "Kannada" | "Kannada (transliterated)",
  "transliteration": if input was Kannada, the romanised/English gloss, else null
}

Rules:
- "chain snatching", "chain-snatching", "chain theft", "sara kalla" (ಸರ ಕಳ್ಳತನ) map to crime_type "Chain Snatching".
- "UPI fraud", "OTP scam", "cyber" map to "Cyber & UPI Fraud".
- "bike theft", "two-wheeler", "vehicle stolen" map to "Vehicle Theft".
- "unsolved", "open", "pending", "ಬಗೆಹರಿಯದ" map to status "UNRESOLVED".
- Output ONLY the JSON object. No prose, no code fences.`;

function stripJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return s;
}

// Offline deterministic fallback parser (used only if the LLM is unreachable).
function heuristicParse(query: string): ParsedIntent {
  const q = query.toLowerCase();
  const hasKannada = /[ಀ-೿]/.test(query);
  let crime_type: string | null = null;
  if (/chain|snatch|sara kalla|ಸರ/.test(q)) crime_type = "Chain Snatching";
  else if (/upi|otp|cyber|fraud|phish|apk/.test(q)) crime_type = "Cyber & UPI Fraud";
  else if (/bike|two.?wheeler|vehicle|scooter|car theft/.test(q)) crime_type = "Vehicle Theft";
  else if (/burglar|theft|break.?in|copper/.test(q)) crime_type = "Burglary & Theft";
  else if (/robber|dacoit|loot/.test(q)) crime_type = "Robbery";
  else if (/harass|assault|molest/.test(q)) crime_type = "Harassment & Assault";
  let district: string | null = null;
  if (/mysuru|mysore/.test(q)) district = "Mysuru";
  else if (/beng|bangalore|blr/.test(q)) district = "Bengaluru Urban";
  else if (/mangal|dakshina/.test(q)) district = "Dakshina Kannada";
  let status: string | null = null;
  if (/unsolv|unresolv|open|pending|ಬಗೆಹರಿ/.test(q)) status = "UNRESOLVED";
  else if (/investigat/.test(q)) status = "INVESTIGATING";
  else if (/resolv|closed|solved/.test(q)) status = "RESOLVED";
  return {
    crime_type,
    district,
    status,
    keywords: q.split(/\s+/).filter((w) => w.length > 3).slice(0, 6),
    language_detected: hasKannada ? "Kannada" : "English",
    transliteration: hasKannada ? "(transliteration unavailable offline)" : null
  };
}

export async function parseNlQueryLLM(
  query: string,
  callGroq: (messages: { role: string; content: string }[]) => Promise<string | null>
): Promise<{ parsed: ParsedIntent; source: "groq" | "heuristic"; rawModelText: string | null }> {
  let rawModelText: string | null = null;
  try {
    rawModelText = await callGroq([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: query }
    ]);
    if (rawModelText) {
      const parsed = JSON.parse(stripJson(rawModelText)) as ParsedIntent;
      // normalise arrays
      if (!Array.isArray(parsed.keywords)) parsed.keywords = [];
      return { parsed, source: "groq", rawModelText };
    }
  } catch (e) {
    // fall through to heuristic
  }
  return { parsed: heuristicParse(query), source: "heuristic", rawModelText };
}

// Run the parsed intent against the real case database.
export async function runParsedQuery(parsed: ParsedIntent) {
  const search = (parsed.keywords || []).slice(0, 2).join(" ") || undefined;
  const result = await queryCasesData({
    page: 1,
    limit: 20,
    district: parsed.district || undefined,
    crime_type: parsed.crime_type || undefined,
    status: parsed.status || undefined,
    search
  });
  return result;
}
