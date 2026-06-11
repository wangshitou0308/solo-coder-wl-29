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
} from "@/types";
import {
  initDB,
  getAllOrders,
  getFamiliesByOrder,
  getGeneraByFamily,
  getSpeciesByGenus,
  getAllSpecies,
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
} from "@/utils/db";

interface AppState {
  initialized: boolean;
  orders: BirdOrder[];
  allSpecies: BirdSpecies[];
  journals: BirdingJournal[];
  observations: BirdObservation[];
  observationsByJournal: Map<string, BirdObservation[]>;
  userSpeciesRecords: UserSpeciesRecord[];
  equipment: Equipment[];
  loading: boolean;

  init: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refreshJournals: () => Promise<void>;
  refreshSpeciesRecords: () => Promise<void>;
  refreshEquipment: () => Promise<void>;

  getJournalDetails: (id: string) => Promise<{ journal: BirdingJournal | undefined; observations: BirdObservation[] }>;
  upsertJournal: (journal: BirdingJournal, observations: BirdObservation[]) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;

  upsertEquipment: (equipment: Equipment) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;

  searchSpecies: (query: string) => Promise<BirdSpecies[]>;
  getSpeciesByGenus: (genusId: string) => Promise<BirdSpecies[]>;
  getFamilies: (orderId: string) => Promise<BirdFamily[]>;
  getGenera: (familyId: string) => Promise<BirdGenus[]>;
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  orders: [],
  allSpecies: [],
  journals: [],
  observations: [],
  observationsByJournal: new Map(),
  userSpeciesRecords: [],
  equipment: [],
  loading: false,

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });
    await initDB();
    const [orders, allSpecies, journals, observations, userSpeciesRecords, equipment] = await Promise.all([
      getAllOrders(),
      getAllSpecies(),
      getAllJournals(),
      getAllObservations(),
      getUserSpeciesRecords(),
      getAllEquipment(),
    ]);
    set({
      initialized: true,
      orders,
      allSpecies,
      journals,
      observations,
      userSpeciesRecords,
      equipment,
      loading: false,
    });
  },

  refreshAll: async () => {
    set({ loading: true });
    await refreshUserSpeciesRecords();
    const [journals, observations, userSpeciesRecords, equipment, allSpecies] = await Promise.all([
      getAllJournals(),
      getAllObservations(),
      getUserSpeciesRecords(),
      getAllEquipment(),
      getAllSpecies(),
    ]);
    set({ journals, observations, userSpeciesRecords, equipment, allSpecies, loading: false });
  },

  refreshJournals: async () => {
    set({ loading: true });
    const journals = await getAllJournals();
    set({ journals, loading: false });
  },

  refreshSpeciesRecords: async () => {
    await refreshUserSpeciesRecords();
    const userSpeciesRecords = await getUserSpeciesRecords();
    set({ userSpeciesRecords });
  },

  refreshEquipment: async () => {
    const equipment = await getAllEquipment();
    set({ equipment });
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
    return getFamiliesByOrder(orderId);
  },

  getGenera: async (familyId: string) => {
    return getGeneraByFamily(familyId);
  },
}));
