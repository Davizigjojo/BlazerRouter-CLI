import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_BASE_URL = "https://blazerrouter.davirediske.workers.dev";

export interface BlazerConfig {
  baseUrl: string;
  apiKey?: string;
}

const configDir = join(homedir(), ".blazerrouter");
const configPath = join(configDir, "config.json");

export async function loadConfig(): Promise<BlazerConfig> {
  let saved: Partial<BlazerConfig> = {};
  try {
    saved = JSON.parse(await readFile(configPath, "utf8")) as Partial<BlazerConfig>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new Error("Não foi possível ler ~/.blazerrouter/config.json. Verifique o arquivo.");
    }
  }

  const baseUrl = (process.env.BLAZERROUTER_BASE_URL || saved.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const apiKey = process.env.BLAZERROUTER_API_KEY || saved.apiKey;
  return { baseUrl, apiKey };
}

export async function saveConfig(config: BlazerConfig): Promise<void> {
  await mkdir(configDir, { recursive: true, mode: 0o700 });
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
  try {
    await chmod(configPath, 0o600);
    await chmod(configDir, 0o700);
  } catch {
    // Windows does not implement POSIX permissions in the same way.
  }
}

export async function clearConfig(): Promise<void> {
  await saveConfig({ baseUrl: DEFAULT_BASE_URL });
}

export function configLocation(): string {
  return configPath;
}
