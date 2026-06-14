import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import {
  Download,
  Upload,
  FileText,
  Database,
  AlertTriangle,
  Check,
  X,
  Eye,
  FileSpreadsheet,
  Image,
  Settings,
  ChevronRight,
  Clock,
  Sparkles,
  Plus,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/Common";
import {
  createBackup,
  downloadBackup,
  triggerImport,
  exportCSV,
  downloadCSV,
  generateBackupFilename,
  type CreateBackupOptions,
} from "@/utils/backup";
import { generateAnnualReport } from "@/utils/pdf";
import { getCurrentYear } from "@/utils/date";
import type { ImageExportStrategy, ImportSummary } from "@/types";
import { ImageExportStrategyLabels } from "@/types";
import { getPdfReportData } from "@/utils/stats";
import {
  getAllJournals,
  getAllObservations,
  getAllSpecies,
  getUserSpeciesRecords,
  getAllFamilies,
  getAllGenera,
} from "@/utils/db";
import { formatDate } from "@/utils/date";

const IMAGE_STRATEGY_OPTIONS: { value: ImageExportStrategy; label: string; description: string }[] = [
  { value: "reference_only", label: "仅引用路径", description: "导出图片URL引用，文件体积最小" },
  { value: "compressed", label: "压缩图片", description: "压缩后嵌入，平衡质量与体积" },
  { value: "original", label: "原图", description: "原图质量嵌入，文件体积最大" },
];

export default function ExportPage() {
  const { refreshAll, markBackupDone, shouldShowBackupReminder, dismissBackupReminder, journals, observations, equipment, wishlist } = useAppStore();
  const [year, setYear] = useState(getCurrentYear());
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState("");
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [imageStrategy, setImageStrategy] = useState<ImageExportStrategy>("reference_only");
  const [includeImages, setIncludeImages] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState<any>(null);
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  useEffect(() => {
    setShowBackupReminder(shouldShowBackupReminder());
  }, [shouldShowBackupReminder]);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setSuccess("");
    try {
      const allJournals = await getAllJournals();
      if (allJournals.length === 0) {
        alert("还没有观鸟日记数据，无法生成年度报告。\n请先记录观鸟日记后再来生成报告。");
        setExportingPdf(false);
        return;
      }
      await generateAnnualReport(year);
      setSuccess("PDF报告已生成并下载");
      markBackupDone();
      setShowBackupReminder(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("PDF导出失败:", error);
      alert("PDF导出失败，请重试");
    }
    setExportingPdf(false);
  };

  const handlePreviewPdf = async () => {
    try {
      const [allJournals, allObs, allSpecies, userRecords, allFamilies, allGenera] = await Promise.all([
        getAllJournals(),
        getAllObservations(),
        getAllSpecies(),
        getUserSpeciesRecords(),
        getAllFamilies(),
        getAllGenera(),
      ]);
      if (allJournals.length === 0) {
        alert("还没有观鸟日记数据，无法预览年度报告。\n请先记录观鸟日记后再来预览报告。");
        return;
      }
      const previewData = getPdfReportData(
        year,
        allSpecies,
        allFamilies,
        allGenera,
        userRecords,
        allJournals,
        allObs
      );
      setPdfPreviewData(previewData);
      setShowPdfPreview(true);
    } catch (error) {
      console.error("PDF预览失败:", error);
      alert("PDF预览失败，请重试");
    }
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    setSuccess("");
    try {
      const options: CreateBackupOptions = {
        includeImages,
        imageStrategy,
      };
      const backup = await createBackup(options);
      const filename = generateBackupFilename();
      downloadBackup(backup, filename);
      setSuccess(`JSON备份已下载: ${filename}`);
      markBackupDone();
      setShowBackupReminder(false);
      setTimeout(() => setSuccess(""), 5000);
    } catch (error) {
      console.error("备份导出失败:", error);
      alert("备份导出失败，请重试");
    }
    setExportingJson(false);
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    setSuccess("");
    try {
      const csv = await exportCSV();
      downloadCSV(csv);
      setSuccess("CSV数据已导出，可用于Excel等工具二次分析");
      markBackupDone();
      setShowBackupReminder(false);
      setTimeout(() => setSuccess(""), 5000);
    } catch (error) {
      console.error("CSV导出失败:", error);
      alert("CSV导出失败，请重试");
    }
    setExportingCsv(false);
  };

  const handleImportJson = async () => {
    if (!window.confirm("导入备份将覆盖现有数据，确定要继续吗？")) {
      return;
    }

    setImporting(true);
    setSuccess("");
    setImportSummary(null);
    try {
      const summary = await triggerImport();
      if (summary) {
        await refreshAll();
        setImportSummary(summary);
        setSuccess("数据导入成功！");
      }
    } catch (error) {
      console.error("导入失败:", error);
      alert("导入失败，请检查文件格式");
    } finally {
      setImporting(false);
    }
  };

  const handleDismissReminder = () => {
    dismissBackupReminder();
    setShowBackupReminder(false);
  };

  const years = [];
  const currentYear = getCurrentYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y);
  }

  return (
    <div className="animate-slide-up pb-8">
      <PageHeader title="数据导出与备份" subtitle="管理你的观鸟数据" />

      {showBackupReminder && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 mb-1">建议备份数据</h4>
              <p className="text-sm text-amber-700 mb-3">
                你已经新增了多条观鸟记录，建议定期导出备份防止数据丢失。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExportJson}
                  className="btn-primary !py-2 !px-4 text-sm"
                >
                  <Download className="w-4 h-4" />
                  立即备份
                </button>
                <button
                  onClick={handleDismissReminder}
                  className="btn-ghost !py-2 !px-4 text-sm"
                >
                  <X className="w-4 h-4" />
                  稍后提醒
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {importSummary && (
        <div className="mb-4 p-5 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-5 h-5 text-green-600" />
            <h3 className="font-serif text-lg font-semibold text-green-800">
              导入成功
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              icon={FileText}
              value={importSummary.journalCount}
              label="观鸟日记"
              color="earth"
            />
            <StatCard
              icon={Eye}
              value={importSummary.observationCount}
              label="观察记录"
              color="olive"
            />
            <StatCard
              icon={Sparkles}
              value={importSummary.speciesRecordCount}
              label="鸟种记录"
              color="amber"
            />
            <StatCard
              icon={Image}
              value={importSummary.equipmentCount}
              label="装备记录"
              color="cream"
            />
            <StatCard
              icon={Clock}
              value={importSummary.wishlistCount}
              label="愿望清单"
              color="amber"
            />
          </div>
          <button
            onClick={() => setImportSummary(null)}
            className="mt-4 btn-ghost !py-2 !px-4 text-sm"
          >
            <X className="w-4 h-4" />
            关闭
          </button>
        </div>
      )}

      {journals.length === 0 && (
        <div className="mb-6 p-6 bg-cream-50 border border-cream-200 rounded-xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-cream-200 flex items-center justify-center mb-3">
            <FileText className="w-8 h-8 text-earth-400" />
          </div>
          <h3 className="font-medium text-earth-700 mb-1">还没有数据可以导出</h3>
          <p className="text-sm text-earth-500 mb-4">
            先记录你的第一条观鸟日记吧
          </p>
          <Link to="/journal/new" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" />
            记录观鸟日记
          </Link>
        </div>
      )}

      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-olive-400 to-olive-600 flex items-center justify-center shadow-md flex-shrink-0">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-1">
                年度观鸟报告 (PDF)
              </h3>
              <p className="text-sm text-earth-500 mb-4">
                生成指定年份的观鸟年度报告，包含年度摘要、首次观察记录、地点排行、月度趋势与代表记录
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="input !py-2 !min-h-0 text-sm sm:w-32"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
                <button
                  onClick={handlePreviewPdf}
                  className="btn-secondary flex-1 sm:flex-none"
                >
                  <Eye className="w-4 h-4" />
                  预览报告
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="btn-primary flex-1"
                >
                  <Download className="w-4 h-4" />
                  {exportingPdf ? "生成中..." : "生成并下载"}
                </button>
              </div>

              <div className="text-xs text-earth-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                报告包含：年度摘要、首次观察、地点排行、月度趋势、代表记录、完整鸟种列表
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-1">
                JSON 完整备份
              </h3>
              <p className="text-sm text-earth-500 mb-4">
                导出所有观鸟数据的完整JSON备份，可用于数据迁移或恢复。文件名自动包含日期与版本号。
              </p>

              <div className="mb-4 p-4 bg-cream-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-earth-500" />
                  <span className="text-sm font-medium text-earth-700">
                    备份选项
                  </span>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="w-4 h-4 rounded border-earth-300 text-olive-600 focus:ring-olive-500"
                    />
                    <span className="text-sm text-earth-700">包含照片数据</span>
                  </label>
                  {includeImages && (
                    <div className="pl-6 space-y-2">
                      <p className="text-xs text-earth-500">图片导出策略：</p>
                      <div className="grid gap-2">
                        {IMAGE_STRATEGY_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                              imageStrategy === opt.value
                                ? "bg-olive-50 border border-olive-200"
                                : "hover:bg-cream-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name="imageStrategy"
                              value={opt.value}
                              checked={imageStrategy === opt.value}
                              onChange={(e) => setImageStrategy(e.target.value as ImageExportStrategy)}
                              className="w-4 h-4 mt-0.5 text-olive-600 focus:ring-olive-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-earth-700">
                                {opt.label}
                              </p>
                              <p className="text-xs text-earth-500">
                                {opt.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportJson}
                  disabled={exportingJson}
                  className="btn-secondary flex-1"
                >
                  <Download className="w-4 h-4" />
                  {exportingJson ? "导出中..." : "导出备份"}
                </button>
                <button
                  onClick={handleImportJson}
                  disabled={importing}
                  className="btn-primary flex-1"
                >
                  <Upload className="w-4 h-4" />
                  {importing ? "导入中..." : "导入备份"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-md flex-shrink-0">
              <FileSpreadsheet className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg font-semibold text-earth-800 mb-1">
                CSV 数据导出
              </h3>
              <p className="text-sm text-earth-500 mb-4">
                导出CSV格式数据，方便在Excel、Google Sheets等工具中进行二次分析。包含观鸟日记、观察记录、鸟种记录、装备与愿望清单。
              </p>

              <button
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="btn-primary w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                {exportingCsv ? "导出中..." : "导出CSV"}
              </button>

              <div className="mt-4 text-xs text-earth-400">
                <p className="font-medium mb-1">导出内容包括：</p>
                <div className="flex flex-wrap gap-2">
                  <span className="chip-cream !py-0.5 !px-2">观鸟日记</span>
                  <span className="chip-cream !py-0.5 !px-2">观察记录</span>
                  <span className="chip-cream !py-0.5 !px-2">鸟种记录</span>
                  <span className="chip-cream !py-0.5 !px-2">装备</span>
                  <span className="chip-cream !py-0.5 !px-2">愿望清单</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-amber-50/50 border-amber-200">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">数据安全提示</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• 数据存储在浏览器本地，清除浏览器数据会导致数据丢失</li>
                <li>• 建议每新增10条记录后导出备份防止数据丢失</li>
                <li>• 导入备份将覆盖现有所有数据，请谨慎操作</li>
                <li>• 照片以Base64格式存储，可能会占用较大存储空间</li>
                <li>• CSV导出不包含照片数据，仅包含引用路径</li>
                <li>• JSON备份文件名格式：birding-backup-v{2}-YYYY-MM-DD-HH-MM-SS.json</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showPdfPreview && pdfPreviewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream-50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-cream-50 border-b border-cream-200 p-4 flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-earth-800">
                {year}年 观鸟年度报告预览
              </h3>
              <button
                onClick={() => setShowPdfPreview(false)}
                className="btn-ghost !p-2 !min-h-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center py-8 bg-gradient-to-br from-olive-50 to-cream-50 rounded-xl">
                <h1 className="font-serif text-3xl font-bold text-olive-700 mb-2">
                  {year} 观鸟年度报告
                </h1>
                <p className="text-earth-500">Annual Birding Journal Review</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={FileText}
                  value={pdfPreviewData.summary.totalJournals}
                  label="观鸟次数"
                  color="earth"
                />
                <StatCard
                  icon={Clock}
                  value={`${pdfPreviewData.summary.totalHours}h`}
                  label="观鸟时长"
                  color="olive"
                />
                <StatCard
                  icon={Sparkles}
                  value={pdfPreviewData.summary.totalSpecies}
                  label="观察鸟种"
                  color="amber"
                />
                <StatCard
                  icon={Eye}
                  value={pdfPreviewData.summary.totalObservations}
                  label="观察记录"
                  color="cream"
                />
              </div>

              <div className="card p-5">
                <h4 className="font-serif text-lg font-semibold text-earth-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-olive-600" />
                  年度亮点
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-olive-50 rounded-xl">
                    <p className="text-sm text-earth-500 mb-1">新增Life List鸟种</p>
                    <p className="text-2xl font-serif font-bold text-olive-700">
                      {pdfPreviewData.summary.newSpecies} 种
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <p className="text-sm text-earth-500 mb-1">最常去地点</p>
                    <p className="text-lg font-serif font-bold text-amber-700 truncate">
                      {pdfPreviewData.summary.topLocation}
                    </p>
                  </div>
                  <div className="p-4 bg-sky-50 rounded-xl">
                    <p className="text-sm text-earth-500 mb-1">最常见鸟种</p>
                    <p className="text-lg font-serif font-bold text-sky-700 truncate">
                      {pdfPreviewData.summary.topSpecies?.species.name_cn || "-"}
                    </p>
                    <p className="text-xs text-earth-500">
                      {pdfPreviewData.summary.topSpecies ? `${pdfPreviewData.summary.topSpecies.observationCount} 次观察` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {pdfPreviewData.firstObservations.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-serif text-lg font-semibold text-earth-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    首次观察记录 (Life List新增)
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pdfPreviewData.firstObservations.slice(0, 10).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-earth-800">
                              {item.species.name_cn}
                            </p>
                            <p className="text-xs text-earth-500 italic">
                              {item.species.name_latin}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-earth-700">
                            {formatDate(item.date)}
                          </p>
                          <p className="text-xs text-earth-500">{item.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pdfPreviewData.locationRankings.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-serif text-lg font-semibold text-earth-800 mb-4 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-olive-600" />
                    地点排行 Top 5
                  </h4>
                  <div className="space-y-2">
                    {pdfPreviewData.locationRankings.slice(0, 5).map((loc: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-cream-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 ${
                            idx === 0 ? "bg-amber-400" :
                            idx === 1 ? "bg-earth-400" :
                            idx === 2 ? "bg-amber-600" :
                            "bg-cream-300"
                          }`}>
                            {idx + 1}
                          </span>
                          <p className="font-medium text-earth-800">{loc.location}</p>
                        </div>
                        <div className="flex gap-4 text-xs text-earth-500">
                          <span>{loc.journalCount} 次</span>
                          <span>{loc.speciesCount} 种</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pdfPreviewData.representativeRecords.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-serif text-lg font-semibold text-earth-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-olive-600" />
                    代表记录
                  </h4>
                  <div className="space-y-3">
                    {pdfPreviewData.representativeRecords.slice(0, 3).map((record: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-olive-50 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-earth-800">
                            {formatDate(record.journal.start_time)}
                          </p>
                          <span className="chip-olive text-xs">
                            {record.species.length} 种鸟
                          </span>
                        </div>
                        <p className="text-sm text-earth-600 mb-2">
                          📍 {record.journal.location || "未命名地点"}
                        </p>
                        <p className="text-sm text-earth-500 truncate">
                          {record.species.map((s: any) => s.name_cn).join("、")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-4 border-t border-cream-200">
                <button
                  onClick={() => setShowPdfPreview(false)}
                  className="btn-secondary"
                >
                  关闭预览
                </button>
                <button
                  onClick={() => {
                    setShowPdfPreview(false);
                    handleExportPdf();
                  }}
                  className="btn-primary"
                >
                  <Download className="w-4 h-4" />
                  下载PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
