import jsPDF from "jspdf";
import type { BirdingJournal, BirdObservation, BirdSpecies, UserSpeciesRecord, BirdFamily, BirdGenus } from "@/types";
import {
  getAllJournals,
  getAllObservations,
  getAllSpecies,
  getUserSpeciesRecords,
  getSpeciesById,
  exportAllData,
  getAllFamilies,
  getAllGenera,
} from "./db";
import { formatDate, formatDuration, getYearKey, getCurrentYear } from "./date";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
} from "@/types";
import { getPdfReportData, type PdfReportData } from "./stats";

export async function generateAnnualReport(year?: number): Promise<void> {
  const targetYear = year ?? getCurrentYear();

  const [allJournals, allObs, allSpecies, userRecords, allFamilies, allGenera] = await Promise.all([
    getAllJournals(),
    getAllObservations(),
    getAllSpecies(),
    getUserSpeciesRecords(),
    getAllFamilies(),
    getAllGenera(),
  ]);

  const reportData = getPdfReportData(
    targetYear,
    allSpecies,
    allFamilies,
    allGenera,
    userRecords,
    allJournals,
    allObs
  );

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 50;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(85, 107, 47);
  doc.text(`Birding Annual Report ${targetYear}`, margin, y);
  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(125, 90, 60);
  doc.text(`Annual Birding Journal - ${targetYear} Year in Review`, margin, y);
  y += 40;

  doc.setFillColor(250, 248, 245);
  doc.roundedRect(margin - 10, y - 10, contentWidth + 20, 180, 8, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(85, 107, 47);
  doc.text("Annual Summary", margin, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);

  const summary = reportData.summary;
  const summaryItems = [
    { label: "Total Birding Trips", value: String(summary.totalJournals) },
    { label: "Total Birding Hours", value: `${summary.totalHours}h` },
    { label: "Total Species Observed", value: String(summary.totalSpecies) },
    { label: "Total Observations", value: String(summary.totalObservations) },
    { label: "New Life List Species", value: String(summary.newSpecies) },
    { label: "Top Location", value: summary.topLocation },
    { label: "Top Species", value: summary.topSpecies?.species.name_cn || "-" },
    { label: "Top Species Count", value: summary.topSpecies ? String(summary.topSpecies.observationCount) : "-" },
  ];

  for (let i = 0; i < summaryItems.length; i += 2) {
    const left = summaryItems[i];
    const right = summaryItems[i + 1];
    doc.text(`${left.label}:`, margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(left.value, margin + 160, y);
    doc.setFont("helvetica", "normal");
    if (right) {
      doc.text(`${right.label}:`, margin + 250, y);
      doc.setFont("helvetica", "bold");
      doc.text(right.value, margin + 410, y);
      doc.setFont("helvetica", "normal");
    }
    y += 20;
  }

  y += 20;

  if (reportData.firstObservations.length > 0) {
    if (y > 650) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(85, 107, 47);
    doc.text("First Observations (Life List)", margin, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(125, 90, 60);
    doc.text("#", margin, y);
    doc.text("Species (CN)", margin + 30, y);
    doc.text("Species (Latin)", margin + 150, y);
    doc.text("Date", margin + 330, y);
    doc.text("Location", margin + 420, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    reportData.firstObservations.forEach((item, idx) => {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      doc.text(String(idx + 1), margin, y);
      doc.text(item.species.name_cn, margin + 30, y);
      doc.text(item.species.name_latin, margin + 150, y);
      doc.text(formatDate(item.date), margin + 330, y);
      doc.text(item.location, margin + 420, y);
      y += 14;
    });
    y += 16;
  }

  if (reportData.locationRankings.length > 0) {
    if (y > 650) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(85, 107, 47);
    doc.text("Location Rankings", margin, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(125, 90, 60);
    doc.text("#", margin, y);
    doc.text("Location", margin + 30, y);
    doc.text("Trips", margin + 280, y);
    doc.text("Species", margin + 350, y);
    doc.text("Observations", margin + 430, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    reportData.locationRankings.slice(0, 10).forEach((loc, idx) => {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      doc.text(String(idx + 1), margin, y);
      doc.text(loc.location, margin + 30, y);
      doc.text(String(loc.journalCount), margin + 280, y);
      doc.text(String(loc.speciesCount), margin + 350, y);
      doc.text(String(loc.observationCount), margin + 430, y);
      y += 14;
    });
    y += 16;
  }

  if (y > 600) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(85, 107, 47);
  doc.text("Monthly Trend", margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(125, 90, 60);
  doc.text("Month", margin, y);
  doc.text("Trips", margin + 100, y);
  doc.text("New Species", margin + 180, y);
  doc.text("Life List New", margin + 280, y);
  doc.text("Hours", margin + 380, y);
  doc.text("Records", margin + 460, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  reportData.monthlyTrend.forEach((month) => {
    if (y > 780) {
      doc.addPage();
      y = margin;
    }
    doc.text(month.month, margin, y);
    doc.text(String(month["观察次数"]), margin + 100, y);
    doc.text(String(month["新鸟种"]), margin + 180, y);
    doc.text(String(month.lifeListNew), margin + 280, y);
    doc.text(String(month["观鸟时长"]), margin + 380, y);
    doc.text(String(month["观察记录数"]), margin + 460, y);
    y += 14;
  });

  y += 16;

  if (reportData.representativeRecords.length > 0) {
    if (y > 550) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(85, 107, 47);
    doc.text("Representative Records", margin, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    reportData.representativeRecords.forEach((record) => {
      if (y > 750) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${formatDate(record.journal.start_time)}  ${record.journal.location}`, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `  Weather: ${record.journal.weather || "-"}  |  Habitat: ${HabitatTypeLabels[record.journal.habitat_type] || record.journal.habitat_type}  |  Duration: ${formatDuration(record.journal.start_time, record.journal.end_time)}`,
        margin, y
      );
      y += 14;
      const speciesList = record.species.map((s) => s.name_cn).join(", ");
      const wrappedText = doc.splitTextToSize(`  Species (${record.species.length}): ${speciesList || "-"}`, contentWidth);
      doc.text(wrappedText, margin, y);
      y += wrappedText.length * 14 + 8;
    });
    y += 16;
  }

  if (reportData.allSpecies.length > 0) {
    if (y > 500) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(85, 107, 47);
    doc.text("Complete Species List", margin, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(125, 90, 60);
    doc.text("#", margin, y);
    doc.text("Species (CN)", margin + 30, y);
    doc.text("Species (Latin)", margin + 130, y);
    doc.text("Habitat", margin + 300, y);
    doc.text("Residence", margin + 380, y);
    doc.text("Count", margin + 460, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    reportData.allSpecies.forEach((item, idx) => {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      doc.text(String(idx + 1), margin, y);
      doc.text(item.species.name_cn, margin + 30, y);
      doc.text(item.species.name_latin, margin + 130, y);
      doc.text(HabitatTypeLabels[item.species.habitat_type], margin + 300, y);
      doc.text(ResidenceTypeLabels[item.species.residence_type], margin + 380, y);
      doc.text(String(item.count), margin + 460, y);
      y += 14;
    });
  }

  doc.save(`birding-annual-report-${targetYear}.pdf`);
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
