import { create } from "zustand";
import type {
  BirdingJournal,
  BirdObservation,
  BirdOrder,
  BirdFamily,
  BirdGenus,
  BirdSpecies,
  UserSpeciesRecord,
  Equipment,
  WishlistItem,
  BackupReminderState,
} from "@/types";
import {
  initDB,
  getAllOrders,
  getFamiliesByOrder,
  getGeneraByFamily,
  getSpeciesByGenus,
  getAllSpecies,
  getAllFamilies,
  getAllGenera,
  getAllJournals,
  getJournalById,
  saveJournal,
  deleteJournal as dbDeleteJournal,
  getObservationsByJournal,
  getAllObservations,
  saveObservations as dbSaveObservations,
  getUserSpeciesRecords,
  getAllEquipment,
  saveEquipment as dbSaveEquipment,
  deleteEquipment as dbDeleteEquipment,
  searchSpecies as dbSearchSpecies,
  refreshUserSpeciesRecords,
  generateId,
  getWishlist,
  saveWishlistItem,
  deleteWishlistItem,
  saveAllWishlist,
} from "@/utils/db";

const WISHLIST_KEY = "birding_wishlist_v2";
const BACKUP_REMINDER_KEY = "birding_backup_reminder";
const BACKUP_REMINDER_THRESHOLD = 10;

interface AppState {
  initialized: boolean;
  orders: BirdOrder[];
  allFamilies: BirdFamily[];
  allGenera: BirdGenus[];
  allSpecies: BirdSpecies[];
  journals: BirdingJournal[];
  observations: BirdObservation[];
  observationsByJournal: Map<string, BirdObservation[]>;
  userSpeciesRecords: UserSpeciesRecord[];
  equipment: Equipment[];
  wishlist: WishlistItem[];
  loading: boolean;

  init: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshJournals: () => Promise<void>;
  refreshSpeciesRecords: () => Promise<void>;
  refreshEquipment: () => Promise<void>;
  refreshWishlist: () => void;

  getJournalDetails: (id: string) => Promise<{ journal: BirdingJournal | undefined; observations: BirdObservation[] }>;
  upsertJournal: (journal: BirdingJournal, observations: BirdObservation[]) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;

  upsertEquipment: (equipment: Equipment) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;

  searchSpecies: (query: string) => Promise<BirdSpecies[]>;
  getSpeciesByGenus: (genusId: string) => Promise<BirdSpecies[]>;
  getFamilies: (orderId: string) => Promise<BirdFamily[]>;
  getGenera: (familyId: string) => Promise<BirdGenus[]>;

  addToWishlist: (speciesId: string) => void;
  removeFromWishlist: (speciesId: string) => void;
  isInWishlist: (speciesId: string) => boolean;
  getWishlistItem: (speciesId: string) => WishlistItem | undefined;

  getBackupReminderState: () => BackupReminderState;
  markBackupDone: () => void;
  shouldShowBackupReminder: () => boolean;
  dismissBackupReminder: () => void;
}

function loadWishlistFromStorage(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load wishlist:", e);
  }
  const legacy = localStorage.getItem("birding_wishlist");
  if (legacy) {
    try {
      const ids: string[] = JSON.parse(legacy);
      const migrated: WishlistItem[] = ids.map((id) => ({
        species_id: id,
        added_at: new Date().toISOString(),
      }));
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(migrated));
      return migrated;
    } catch (e) {
      console.error("Failed to migrate wishlist:", e);
    }
  }
  return [];
}

function saveWishlistToStorage(items: WishlistItem[]): void {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

function loadBackupReminderState(): BackupReminderState {
  try {
    const raw = localStorage.getItem(BACKUP_REMINDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load backup reminder state:", e);
  }
  return {
    lastReminderAt: null,
    recordsSinceLastBackup: 0,
    lastBackupAt: null,
  };
}

function saveBackupReminderState(state: BackupReminderState): void {
  localStorage.setItem(BACKUP_REMINDER_KEY, JSON.stringify(state));
}

function updateWishlistCompletion(
  wishlist: WishlistItem[],
  userRecords: UserSpeciesRecord[]
): WishlistItem[] {
  const observedIds = new Set(userRecords.map((r) => r.species_id));
  let changed = false;
  const updated = wishlist.map((item) => {
    if (observedIds.has(item.species_id) && !item.completed_at) {
      changed = true;
      const record = userRecords.find((r) => r.species_id === item.species_id);
      return { ...item, completed_at: record?.first_observed_at || new Date().toISOString() };
    }
    return item;
  });
  if (changed) saveWishlistToStorage(updated);
  return updated;
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  orders: [],
  allFamilies: [],
  allGenera: [],
  allSpecies: [],
  journals: [],
  observations: [],
  observationsByJournal: new Map(),
  userSpeciesRecords: [],
  equipment: [],
  wishlist: [],
  loading: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });
    await initDB();
    const [
      orders,
      allFamilies,
      allGenera,
      allSpecies,
      journals,
      observations,
      userSpeciesRecords,
      equipment,
      dbWishlist,
    ] = await Promise.all([
      getAllOrders(),
      getAllFamilies(),
      getAllGenera(),
      getAllSpecies(),
      getAllJournals(),
      getAllObservations(),
      getUserSpeciesRecords(),
      getAllEquipment(),
      getWishlist(),
    ]);

    let wishlist = dbWishlist;
    if (dbWishlist.length === 0) {
      const legacyWishlist = loadWishlistFromStorage();
      if (legacyWishlist.length > 0) {
        await saveAllWishlist(legacyWishlist);
        wishlist = legacyWishlist;
      }
    }
    wishlist = updateWishlistCompletion(wishlist, userSpeciesRecords);

    set({
      initialized: true,
      orders,
      allFamilies,
      allGenera,
      allSpecies,
      journals,
      observations,
      userSpeciesRecords,
      equipment,
      wishlist,
      loading: false,
    });
  },

  refreshAll: async () => {
    set({ loading: true });
    await refreshUserSpeciesRecords();
    const [
      journals,
      observations,
      userSpeciesRecords,
      equipment,
      allSpecies,
    ] = await Promise.all([
      getAllJournals(),
      getAllObservations(),
      getUserSpeciesRecords(),
      getAllEquipment(),
      getAllSpecies(),
    ]);

    const prevJournalCount = get().journals.length;
    const newJournalCount = journals.length;
    if (newJournalCount > prevJournalCount) {
      const state = loadBackupReminderState();
      state.recordsSinceLastBackup += newJournalCount - prevJournalCount;
      saveBackupReminderState(state);
    }

    const updatedWishlist = updateWishlistCompletion(get().wishlist, userSpeciesRecords);

    set({
      journals,
      observations,
      userSpeciesRecords,
      equipment,
      allSpecies,
      wishlist: updatedWishlist,
      loading: false,
    });
  },

  refreshJournals: async () => {
    set({ loading: true });
    const journals = await getAllJournals();
    set({ journals, loading: false });
  },

  refreshSpeciesRecords: async () => {
    await refreshUserSpeciesRecords();
    const userSpeciesRecords = await getUserSpeciesRecords();
    const updatedWishlist = updateWishlistCompletion(get().wishlist, userSpeciesRecords);
    set({ userSpeciesRecords, wishlist: updatedWishlist });
  },

  refreshEquipment: async () => {
    const equipment = await getAllEquipment();
    set({ equipment });
  },

  refreshWishlist: () => {
    const items = loadWishlistFromStorage();
    const updated = updateWishlistCompletion(items, get().userSpeciesRecords);
    set({ wishlist: updated });
  },

  getJournalDetails: async (id: string) => {
    const [journal, observations] = await Promise.all([
      getJournalById(id),
      getObservationsByJournal(id),
    ]);
    return { journal, observations };
  },

  upsertJournal: async (journal: BirdingJournal, observations: BirdObservation[]) => {
    const isNew = !journal.id;
    if (isNew) {
      journal.id = generateId();
      journal.created_at = new Date().toISOString();
    }
    journal.updated_at = new Date().toISOString();

    const savedObs = observations.map((o) => ({
      ...o,
      id: o.id || generateId(),
      journal_id: journal.id,
      created_at: o.created_at || new Date().toISOString(),
    }));

    await saveJournal(journal);
    await dbSaveObservations(savedObs, journal.id);
    await get().refreshAll();
  },

  deleteJournal: async (id: string) => {
    await dbDeleteJournal(id);
    await get().refreshAll();
  },

  upsertEquipment: async (equipment: Equipment) => {
    if (!equipment.id) {
      equipment.id = generateId();
      equipment.created_at = new Date().toISOString();
    }
    await dbSaveEquipment(equipment);
    await get().refreshEquipment();
  },

  deleteEquipment: async (id: string) => {
    await dbDeleteEquipment(id);
    await get().refreshEquipment();
  },

  searchSpecies: async (query: string) => {
    return dbSearchSpecies(query);
  },

  getSpeciesByGenus: async (genusId: string) => {
    return getSpeciesByGenus(genusId);
  },

  getFamilies: async (orderId: string) => {
    const cached = get().allFamilies.filter((f) => f.order_id === orderId);
    if (cached.length > 0) return cached;
    return getFamiliesByOrder(orderId);
  },

  getGenera: async (familyId: string) => {
    const cached = get().allGenera.filter((g) => g.family_id === familyId);
    if (cached.length > 0) return cached;
    return getGeneraByFamily(familyId);
  },

  addToWishlist: (speciesId: string) => {
    const existing = get().wishlist.find((w) => w.species_id === speciesId);
    if (existing) return;
    const newItem: WishlistItem = {
      species_id: speciesId,
      added_at: new Date().toISOString(),
    };
    const wishlist = [...get().wishlist, newItem];
    saveWishlistToStorage(wishlist);
    saveWishlistItem(newItem);
    set({ wishlist });
  },

  removeFromWishlist: (speciesId: string) => {
    const wishlist = get().wishlist.filter((w) => w.species_id !== speciesId);
    saveWishlistToStorage(wishlist);
    deleteWishlistItem(speciesId);
    set({ wishlist });
  },

  isInWishlist: (speciesId: string) => {
    return get().wishlist.some((w) => w.species_id === speciesId);
  },

  getWishlistItem: (speciesId: string) => {
    return get().wishlist.find((w) => w.species_id === speciesId);
  },

  getBackupReminderState: () => loadBackupReminderState(),

  markBackupDone: () => {
    const state = loadBackupReminderState();
    state.lastBackupAt = new Date().toISOString();
    state.recordsSinceLastBackup = 0;
    saveBackupReminderState(state);
  },

  shouldShowBackupReminder: () => {
    const state = loadBackupReminderState();
    if (state.recordsSinceLastBackup < BACKUP_REMINDER_THRESHOLD) return false;
    if (state.lastReminderAt) {
      const lastReminder = new Date(state.lastReminderAt).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - lastReminder < oneDay) return false;
    }
    return true;
  },

  dismissBackupReminder: () => {
    const state = loadBackupReminderState();
    state.lastReminderAt = new Date().toISOString();
    saveBackupReminderState(state);
  },
}));
