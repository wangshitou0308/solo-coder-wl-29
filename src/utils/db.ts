import { openDB, DBSchema, IDBPDatabase } from "idb";
import type {
  BirdOrder,
  BirdFamily,
  BirdGenus,
  BirdSpecies,
  BirdingJournal,
  BirdObservation,
  UserSpeciesRecord,
  Equipment,
} from "@/types";
import { seedBirdData, isSeeded, setSeeded } from "./seed";

interface BirdingDB extends DBSchema {
  bird_orders: {
    key: string;
    value: BirdOrder;
  };
  bird_families: {
    key: string;
    value: BirdFamily;
    indexes: { order_id: string };
  };
  bird_genera: {
    key: string;
    value: BirdGenus;
    indexes: { family_id: string };
  };
  bird_species: {
    key: string;
    value: BirdSpecies;
    indexes: { genus_id: string; habitat_type: string; residence_type: string };
  };
  journals: {
    key: string;
    value: BirdingJournal;
    indexes: { created_at: string; location: string };
  };
  observations: {
    key: string;
    value: BirdObservation;
    indexes: { journal_id: string; species_id: string };
  };
  user_species_records: {
    key: string;
    value: UserSpeciesRecord;
  };
  equipment: {
    key: string;
    value: Equipment;
  };
}

const DB_NAME = "birding-journal-db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<BirdingDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<BirdingDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BirdingDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("bird_orders")) {
        db.createObjectStore("bird_orders", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("bird_families")) {
        const s = db.createObjectStore("bird_families", { keyPath: "id" });
        s.createIndex("order_id", "order_id");
      }
      if (!db.objectStoreNames.contains("bird_genera")) {
        const s = db.createObjectStore("bird_genera", { keyPath: "id" });
        s.createIndex("family_id", "family_id");
      }
      if (!db.objectStoreNames.contains("bird_species")) {
        const s = db.createObjectStore("bird_species", { keyPath: "id" });
        s.createIndex("genus_id", "genus_id");
        s.createIndex("habitat_type", "habitat_type");
        s.createIndex("residence_type", "residence_type");
      }
      if (!db.objectStoreNames.contains("journals")) {
        const s = db.createObjectStore("journals", { keyPath: "id" });
        s.createIndex("created_at", "created_at");
        s.createIndex("location", "location");
      }
      if (!db.objectStoreNames.contains("observations")) {
        const s = db.createObjectStore("observations", { keyPath: "id" });
        s.createIndex("journal_id", "journal_id");
        s.createIndex("species_id", "species_id");
      }
      if (!db.objectStoreNames.contains("user_species_records")) {
        db.createObjectStore("user_species_records", { keyPath: "species_id" });
      }
      if (!db.objectStoreNames.contains("equipment")) {
        db.createObjectStore("equipment", { keyPath: "id" });
      }
    },
  });

  if (!isSeeded()) {
    await seedBirdData(dbInstance);
    setSeeded();
  }

  return dbInstance;
}

export function getDB(): IDBPDatabase<BirdingDB> | null {
  return dbInstance;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function getAllOrders(): Promise<BirdOrder[]> {
  const db = await initDB();
  return db.getAll("bird_orders");
}

export async function getFamiliesByOrder(orderId: string): Promise<BirdFamily[]> {
  const db = await initDB();
  return db.getAllFromIndex("bird_families", "order_id", orderId);
}

export async function getGeneraByFamily(familyId: string): Promise<BirdGenus[]> {
  const db = await initDB();
  return db.getAllFromIndex("bird_genera", "family_id", familyId);
}

export async function getSpeciesByGenus(genusId: string): Promise<BirdSpecies[]> {
  const db = await initDB();
  return db.getAllFromIndex("bird_species", "genus_id", genusId);
}

export async function getAllSpecies(): Promise<BirdSpecies[]> {
  const db = await initDB();
  return db.getAll("bird_species");
}

export async function getSpeciesById(id: string): Promise<BirdSpecies | undefined> {
  const db = await initDB();
  return db.get("bird_species", id);
}

export async function getOrderById(id: string): Promise<BirdOrder | undefined> {
  const db = await initDB();
  return db.get("bird_orders", id);
}

export async function getFamilyById(id: string): Promise<BirdFamily | undefined> {
  const db = await initDB();
  return db.get("bird_families", id);
}

export async function getGenusById(id: string): Promise<BirdGenus | undefined> {
  const db = await initDB();
  return db.get("bird_genera", id);
}

export async function searchSpecies(query: string): Promise<BirdSpecies[]> {
  const all = await getAllSpecies();
  const q = query.toLowerCase().trim();
  if (!q) return all;
  return all.filter(
    (s) =>
      s.name_cn.includes(query) ||
      s.name_latin.toLowerCase().includes(q) ||
      (s.common_name && s.common_name.toLowerCase().includes(q))
  );
}

export async function getAllJournals(): Promise<BirdingJournal[]> {
  const db = await initDB();
  const items = await db.getAllFromIndex("journals", "created_at");
  return items.reverse();
}

export async function getJournalById(id: string): Promise<BirdingJournal | undefined> {
  const db = await initDB();
  return db.get("journals", id);
}

export async function saveJournal(journal: BirdingJournal): Promise<string> {
  const db = await initDB();
  return db.put("journals", journal);
}

export async function deleteJournal(id: string): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(["journals", "observations"], "readwrite");
  await tx.objectStore("journals").delete(id);
  const obs = await tx.objectStore("observations").index("journal_id").getAll(id);
  for (const o of obs) {
    await tx.objectStore("observations").delete(o.id);
  }
  await tx.done;
  await refreshUserSpeciesRecords();
}

export async function getObservationsByJournal(journalId: string): Promise<BirdObservation[]> {
  const db = await initDB();
  return db.getAllFromIndex("observations", "journal_id", journalId);
}

export async function getObservationsBySpecies(speciesId: string): Promise<BirdObservation[]> {
  const db = await initDB();
  return db.getAllFromIndex("observations", "species_id", speciesId);
}

export async function getAllObservations(): Promise<BirdObservation[]> {
  const db = await initDB();
  return db.getAll("observations");
}

export async function saveObservations(
  observations: BirdObservation[],
  journalId: string
): Promise<void> {
  const db = await initDB();
  const tx = db.transaction("observations", "readwrite");
  const existing = await tx.store.index("journal_id").getAll(journalId);
  for (const o of existing) {
    await tx.store.delete(o.id);
  }
  for (const o of observations) {
    await tx.store.put(o);
  }
  await tx.done;
  await refreshUserSpeciesRecords();
}

export async function saveObservation(observation: BirdObservation): Promise<string> {
  const db = await initDB();
  return db.put("observations", observation);
}

export async function deleteObservation(id: string): Promise<void> {
  const db = await initDB();
  await db.delete("observations", id);
}

export async function getUserSpeciesRecords(): Promise<UserSpeciesRecord[]> {
  const db = await initDB();
  return db.getAll("user_species_records");
}

export async function getUserSpeciesRecord(
  speciesId: string
): Promise<UserSpeciesRecord | undefined> {
  const db = await initDB();
  return db.get("user_species_records", speciesId);
}

export async function refreshUserSpeciesRecords(): Promise<void> {
  const db = await initDB();
  const allObs = await db.getAll("observations");
  const allJournals = await db.getAll("journals");
  const journalMap = new Map(allJournals.map((j) => [j.id, j]));

  const speciesMap = new Map<string, { first: string; location: string; count: number }>();

  for (const obs of allObs) {
    const journal = journalMap.get(obs.journal_id);
    if (!journal) continue;
    const existing = speciesMap.get(obs.species_id);
    if (!existing) {
      speciesMap.set(obs.species_id, {
        first: journal.start_time,
        location: journal.location,
        count: 1,
      });
    } else {
      if (journal.start_time < existing.first) {
        existing.first = journal.start_time;
        existing.location = journal.location;
      }
      existing.count += 1;
    }
  }

  const tx = db.transaction("user_species_records", "readwrite");
  await tx.store.clear();
  for (const [species_id, data] of speciesMap) {
    await tx.store.put({
      species_id,
      first_observed_at: data.first,
      first_location: data.location,
      total_observations: data.count,
    });
  }
  await tx.done;
}

export async function getAllEquipment(): Promise<Equipment[]> {
  const db = await initDB();
  const items = await db.getAll("equipment");
  return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function saveEquipment(equipment: Equipment): Promise<string> {
  const db = await initDB();
  return db.put("equipment", equipment);
}

export async function deleteEquipment(id: string): Promise<void> {
  const db = await initDB();
  await db.delete("equipment", id);
}

export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const db = await initDB();
  const stores = [
    "bird_orders",
    "bird_families",
    "bird_genera",
    "bird_species",
    "journals",
    "observations",
    "user_species_records",
    "equipment",
  ] as const;
  const result: Record<string, unknown[]> = {};
  for (const store of stores) {
    result[store] = await db.getAll(store);
  }
  return result;
}

export async function importAllData(data: Record<string, unknown[]>): Promise<void> {
  const db = await initDB();
  const userStores = [
    "journals",
    "observations",
    "user_species_records",
    "equipment",
  ] as const;
  const tx = db.transaction(userStores, "readwrite");
  for (const store of userStores) {
    await tx.objectStore(store).clear();
  }
  for (const store of userStores) {
    if (data[store]) {
      for (const item of data[store]) {
        await tx.objectStore(store as any).put(item as any);
      }
    }
  }
  await tx.done;
}
