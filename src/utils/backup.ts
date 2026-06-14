import { exportAllData, importAllData, initDB, getAllJournals, getAllObservations, getAllSpecies, getUserSpeciesRecords, getAllEquipment, getWishlist } from "./db";
import type { ImageExportStrategy, ImportSummary } from "@/types";
import { formatDate } from "./date";

export const BACKUP_VERSION = 2;

export interface CreateBackupOptions {
  includeImages?: boolean;
  imageStrategy?: ImageExportStrategy;
}

export async function createBackup(options: CreateBackupOptions = {}): Promise<string> {
  const data = await exportAllData();
  const backup = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    imageStrategy: options.imageStrategy || "reference_only",
    includeImages: options.includeImages || false,
    data,
  };
  return JSON.stringify(backup, null, 2);
}

export function generateBackupFilename(): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `birding-backup-v${BACKUP_VERSION}-${dateStr}.json`;
}

export function downloadBackup(json: string, filename?: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || generateBackupFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreBackup(file: File): Promise<ImportSummary> {
  await initDB();
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed.data || typeof parsed.data !== "object") {
    throw new Error("Invalid backup file");
  }
  const summary = await importAllData(parsed.data);
  return summary;
}

export async function triggerImport(): Promise<ImportSummary | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    let resolved = false;
    const finish = (result: ImportSummary | null) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      try {
        const summary = await restoreBackup(file);
        finish(summary);
      } catch (e) {
        console.error("Restore error:", e);
        throw e;
      }
    };
    input.oncancel = () => {
      finish(null);
    };
    setTimeout(() => {
      finish(null);
    }, 60000);
    input.click();
  });
}

export async function exportCSV(): Promise<string> {
  const [journals, observations, allSpecies, userRecords, equipment, wishlist] = await Promise.all([
    getAllJournals(),
    getAllObservations(),
    getAllSpecies(),
    getUserSpeciesRecords(),
    getAllEquipment(),
    getWishlist(),
  ]);

  const speciesMap = new Map(allSpecies.map((s) => [s.id, s]));
  const journalMap = new Map(journals.map((j) => [j.id, j]));

  let csv = "\uFEFF";

  csv += "=== 观鸟日记 ===\n";
  csv += "ID,日期,开始时间,结束时间,地点,纬度,经度,天气,栖息地,同伴,备注,创建时间,更新时间\n";
  journals.forEach((j) => {
    csv += [
      j.id,
      formatDate(j.start_time),
      j.start_time,
      j.end_time,
      `"${(j.location || "").replace(/"/g, '""')}"`,
      j.latitude || "",
      j.longitude || "",
      j.weather || "",
      j.habitat_type,
      `"${(j.companions || "").replace(/"/g, '""')}"`,
      `"${(j.notes || "").replace(/"/g, '""')}"`,
      j.created_at,
      j.updated_at,
    ].join(",") + "\n";
  });

  csv += "\n=== 观察记录 ===\n";
  csv += "ID,日记ID,鸟种ID,鸟种中文名,鸟种学名,数量,行为,照片URL,备注,创建时间\n";
  observations.forEach((o) => {
    const species = speciesMap.get(o.species_id);
    csv += [
      o.id,
      o.journal_id,
      o.species_id,
      species ? `"${species.name_cn.replace(/"/g, '""')}"` : "",
      species ? `"${species.name_latin.replace(/"/g, '""')}"` : "",
      o.count,
      o.behavior || "",
      o.photo_url ? `"${o.photo_url.replace(/"/g, '""')}"` : "",
      `"${(o.notes || "").replace(/"/g, '""')}"`,
      o.created_at,
    ].join(",") + "\n";
  });

  csv += "\n=== 用户鸟种记录 ===\n";
  csv += "鸟种ID,鸟种中文名,鸟种学名,首次观察时间,首次观察地点,总观察次数\n";
  userRecords.forEach((r) => {
    const species = speciesMap.get(r.species_id);
    csv += [
      r.species_id,
      species ? `"${species.name_cn.replace(/"/g, '""')}"` : "",
      species ? `"${species.name_latin.replace(/"/g, '""')}"` : "",
      r.first_observed_at,
      `"${(r.first_location || "").replace(/"/g, '""')}"`,
      r.total_observations,
    ].join(",") + "\n";
  });

  csv += "\n=== 装备 ===\n";
  csv += "ID,类型,品牌,型号,购买日期,使用次数,快门次数,备注,创建时间\n";
  equipment.forEach((e) => {
    csv += [
      e.id,
      e.type,
      `"${(e.brand || "").replace(/"/g, '""')}"`,
      `"${(e.model || "").replace(/"/g, '""')}"`,
      e.purchase_date || "",
      e.usage_count,
      e.shutter_count || "",
      `"${(e.notes || "").replace(/"/g, '""')}"`,
      e.created_at,
    ].join(",") + "\n";
  });

  csv += "\n=== 愿望清单 ===\n";
  csv += "鸟种ID,鸟种中文名,鸟种学名,加入时间,完成时间\n";
  wishlist.forEach((w) => {
    const species = speciesMap.get(w.species_id);
    csv += [
      w.species_id,
      species ? `"${species.name_cn.replace(/"/g, '""')}"` : "",
      species ? `"${species.name_latin.replace(/"/g, '""')}"` : "",
      w.added_at,
      w.completed_at || "",
    ].join(",") + "\n";
  });

  return csv;
}

export function downloadCSV(csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 10);
  a.download = `birding-data-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportObservationsWithImages(
  strategy: ImageExportStrategy = "reference_only"
): Promise<{ csv: string; images: Record<string, string> }> {
  const [journals, observations, allSpecies] = await Promise.all([
    getAllJournals(),
    getAllObservations(),
    getAllSpecies(),
  ]);

  const speciesMap = new Map(allSpecies.map((s) => [s.id, s]));
  const journalMap = new Map(journals.map((j) => [j.id, j]));
  const images: Record<string, string> = {};

  let csv = "\uFEFF";
  csv += "观察日期,鸟种中文名,鸟种学名,数量,行为,地点,栖息地,照片URL,备注\n";

  for (const o of observations) {
    const journal = journalMap.get(o.journal_id);
    const species = speciesMap.get(o.species_id);

    if (o.photo_url && strategy !== "reference_only") {
      if (strategy === "compressed") {
        try {
          const compressed = await compressImage(o.photo_url);
          images[`${o.id}-compressed`] = compressed;
        } catch (e) {
          console.warn("Failed to compress image:", e);
          images[o.id] = o.photo_url;
        }
      } else if (strategy === "original") {
        images[o.id] = o.photo_url;
      }
    }

    csv += [
      journal ? formatDate(journal.start_time) : "",
      species ? `"${species.name_cn.replace(/"/g, '""')}"` : "",
      species ? `"${species.name_latin.replace(/"/g, '""')}"` : "",
      o.count,
      o.behavior || "",
      journal ? `"${(journal.location || "").replace(/"/g, '""')}"` : "",
      journal ? journal.habitat_type : "",
      strategy === "reference_only" ? (o.photo_url || "") : (o.photo_url ? `See attached image ${o.id}` : ""),
      `"${(o.notes || "").replace(/"/g, '""')}"`,
    ].join(",") + "\n";
  }

  return { csv, images };
}

async function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
