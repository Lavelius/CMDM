import { promises as fs } from "node:fs";
import * as path from "node:path";

export type Json = unknown;

function baseDir() {
  // saves to project/.cmdm
  return path.resolve(process.cwd(), ".cmdm");
}

async function ensureDir() {
  await fs.mkdir(baseDir(), { recursive: true });
}

export async function writeJson(fileName: string, data: Json) {
  await ensureDir();
  const full = path.join(baseDir(), fileName);
  await fs.writeFile(full, JSON.stringify(data, null, 2), "utf8");
}

export async function readJson<T>(fileName: string): Promise<T | null> {
  try {
    const full = path.join(baseDir(), fileName);
    const raw = await fs.readFile(full, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function listFiles(): Promise<string[]> {
  await ensureDir();
  const files = await fs.readdir(baseDir());
  return files;
}
