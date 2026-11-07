import type { BlazerConfig } from "./config.js";

export interface Model {
  id: string;
  object?: string;
  owned_by?: string;
}

export class BlazerApi {
  constructor(private readonly config: BlazerConfig) {}

  private headers(): HeadersInit {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`;
    return headers;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}${path}`, {
        ...init,
        headers: { ...this.headers(), ...(init.headers as Record<string, string> | undefined) },
        signal: AbortSignal.timeout(60_000)
      });
    } catch {
      throw new Error("Não foi possível conectar ao BlazerRouter. Verifique sua internet e a URL configurada.");
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      let message = `A API respondeu HTTP ${response.status}.`;
      try {
        const parsed = JSON.parse(body) as { error?: { message?: string } | string; message?: string };
        if (typeof parsed.error === "string") message = parsed.error;
        else if (parsed.error?.message) message = parsed.error.message;
        else if (parsed.message) message = parsed.message;
      } catch {
        // Do not print arbitrary upstream response bodies; they may contain sensitive data.
      }
      throw new Error(message);
    }
    return response.json() as Promise<T>;
  }

  async listModels(): Promise<Model[]> {
    const result = await this.request<{ data?: Model[] }>("/v1/models");
    return result.data ?? [];
  }

  async chat(model: string, messages: Array<{ role: string; content: string }>): Promise<string> {
    const result = await this.request<{
      choices?: Array<{ message?: { content?: string } }>;
    }>("/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({ model, messages, stream: false })
    });
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error("A API respondeu, mas não retornou texto na primeira escolha.");
    return content;
  }
}
