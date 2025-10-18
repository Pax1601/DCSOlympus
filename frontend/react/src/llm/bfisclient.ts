export type BFISDecisionResponse = { id: string; timestamp: string };

function baseUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("bfis");
    if (url) return url;
  } catch {}
  return "http://localhost:8713";
}

export async function bfisHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${baseUrl()}/health`, { method: "GET" });
    if (!r.ok) return false;
    const j = await r.json();
    return !!j.ok;
  } catch {
    return false;
  }
}

export async function bfisSendDecision(text: string): Promise<BFISDecisionResponse | null> {
  try {
    const r = await fetch(`${baseUrl()}/intel/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) return null;
    return (await r.json()) as BFISDecisionResponse;
  } catch {
    return null;
  }
}

