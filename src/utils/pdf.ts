import jsPDF from "jspdf";
import type { BirdingJournal, BirdObservation, BirdSpecies, UserSpeciesRecord } from "@/types";
import {
  getAllJournals,
  getAllObservations,
  getAllSpecies,
  getUserSpeciesRecords,
  getSpeciesById,
  exportAllData,
} from "./db";
import { formatDate, formatDuration, getYearKey, getCurrentYear } from "./date";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
} from "@/types";

export async function generateAnnualReport(year?: number): Promise<void> {
  const targetYear = year ?? getCurrentYear();
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const allJournals = await getAllJournals();
  const allObs = await getAllObservations();
  const allSpecies = await getAllSpecies();
  const userRecords = await getUserSpeciesRecords();

  const yearJournals = allJournals.filter((j) => getYearKey(j.start_time) === String(targetYear));
  const journalIds = new Set(yearJournals.map((j) => j.id));
  const yearObs = allObs.filter((o) => journalIds.has(o.journal_id));
  const speciesMap = new Map(allSpecies.map((s) => [s.id, s]));

  const yearSpeciesIds = new Set(yearObs.map((o) => o.species_id));
  const yearSpecies = Array.from(yearSpeciesIds)
    .map((id) => speciesMap.get(id))
    .filter(Boolean) as BirdSpecies[];

  let totalMinutes = 0;
  for (const j of yearJournals) {
    const dur = (new Date(j.end_time).getTime() - new Date(j.start_time).getTime()) / 60000;
    if (dur > 0) totalMinutes += dur;
  }

  const habitatCount: Record<string, number> = {};
  for (const s of yearSpecies) {
    const label = HabitatTypeLabels[s.habitat_type] || s.habitat_type;
    habitatCount[label] = (habitatCount[label] || 0) + 1;
  }

  const residenceCount: Record<string, number> = {};
  for (const s of yearSpecies) {
    const label = ResidenceTypeLabels[s.residence_type] || s.residence_type;
    residenceCount[label] = (residenceCount[label] || 0) + 1;
  }

  const margin = 50;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(`Birding Annual Report ${targetYear}`, margin, y);
  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Annual Birding Journal - ${targetYear} Year in Review`, margin, y);
  y += 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Summary", margin, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Total Birding Trips: ${yearJournals.length}`, margin, y); y += 16;
  doc.text(`Total Birding Hours: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, margin, y); y += 16;
  doc.text(`Total Species Observed: ${yearSpecies.length}`, margin, y); y += 16;
  doc.text(`Total Observations (entries): ${yearObs.length}`, margin, y); y += 32;

  if (yearSpeciesIds.size > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Species List", margin, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("#", margin, y);
    doc.text("Species (CN)", margin + 30, y);
    doc.text("Species (Latin)", margin + 130, y);
    doc.text("Habitat", margin + 300, y);
    doc.text("Residence", margin + 380, y);
    doc.text("Count", margin + 460, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    const sorted = yearSpecies.sort((a, b) => a.name_cn.localeCompare(b.name_cn, "zh"));
    let idx = 1;
    for (const s of sorted) {
      const spCount = yearObs.filter((o) => o.species_id === s.id).reduce((sum, o) => sum + o.count, 0);
      if (y > 750) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(10);
      doc.text(String(idx), margin, y);
      doc.text(s.name_cn, margin + 30, y);
      doc.text(s.name_latin, margin + 130, y);
      doc.text(HabitatTypeLabels[s.habitat_type], margin + 300, y);
      doc.text(ResidenceTypeLabels[s.residence_type], margin + 380, y);
      doc.text(String(spCount), margin + 460, y);
      y += 14;
      idx++;
    }
    y += 20;
  }

  if (yearJournals.length > 0) {
    if (y > 700) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Trips", margin, y);
    y += 24;

    for (const j of yearJournals) {
      if (y > 750) {
        doc.addPage();
        y = margin;
      }
      const jObs = yearObs.filter((o) => o.journal_id === j.id);
      const jSpecies = new Set(jObs.map((o) => o.species_id));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${formatDate(j.start_time)}  ${j.location}`, margin, y); y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `  Weather: ${j.weather || "-"}  |  Habitat: ${HabitatTypeLabels[j.habitat_type] || j.habitat_type}  |  Duration: ${formatDuration(j.start_time, j.end_time)}`,
        margin, y
      ); y += 14;
      const speciesList = Array.from(jSpecies)
        .map((sid) => speciesMap.get(sid)?.name_cn)
        .filter(Boolean)
        .join(", ");
      doc.text(`  Species (${jSpecies.size}): ${speciesList || "-"}`, margin, y);
      y += 18;
    }
  }

  doc.save(`birding-report-${targetYear}.pdf`);
}

export interface ObservationWithSpecies extends BirdObservation {
  species?: BirdSpecies;
}

export interface JournalWithDetails extends BirdingJournal {
  observations: ObservationWithSpecies[];
}

export async function getFullBackup(): Promise<Record<string, unknown>> {
  const data = await exportAllData();
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    ...data,
  };
}
