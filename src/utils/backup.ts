import { exportAllData, importAllData, initDB } from "./db";

export async function createBackup(): Promise<string> {
  const data = await exportAllData();
  const backup = {
    version: 1,
    exported_at: new Date().toISOString(),
    data,
  };
  return JSON.stringify(backup, null, 2);
}

export function downloadBackup(json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `birding-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreBackup(file: File): Promise<void> {
  await initDB();
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed.data || typeof parsed.data !== "object") {
    throw new Error("Invalid backup file");
  }
  await importAllData(parsed.data);
}

export async function triggerImport(): Promise<void> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      try {
        await restoreBackup(file);
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
