import { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  Download,
  Upload,
  FileText,
  Database,
  AlertTriangle,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/Common";
import { createBackup, downloadBackup, triggerImport } from "@/utils/backup";
import { generateAnnualReport } from "@/utils/pdf";
import { getCurrentYear } from "@/utils/date";

export default function ExportPage() {
  const { refreshAll } = useAppStore();
  const [year, setYear] = useState(getCurrentYear());
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState("");

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setSuccess("");
    try {
      await generateAnnualReport(year);
      setSuccess("PDF报告已生成并下载");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("PDF导出失败:", error);
      alert("PDF导出失败，请重试");
    }
    setExportingPdf(false);
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    setSuccess("");
    try {
      const backup = await createBackup();
      downloadBackup(backup);
      setSuccess("JSON备份已下载");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("备份导出失败:", error);
      alert("备份导出失败，请重试");
    }
    setExportingJson(false);
  };

  const handleImportJson = async () => {
    if (!window.confirm("导入备份将覆盖现有数据，确定要继续吗？")) {
      return;
    }

    setImporting(true);
    setSuccess("");
    try {
      await triggerImport();
      await refreshAll();
      setSuccess("数据导入成功");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("导入失败:", error);
      alert("导入失败，请检查文件格式");
    }
    setImporting(false);
  };

  const years = [];
  const currentYear = getCurrentYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y);
  }

  return (
    <div className="animate-slide-up">
      <PageHeader title="数据导出与备份" subtitle="管理你的观鸟数据" />

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">{success}</p>
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
                生成指定年份的观鸟年度报告，包含统计数据、鸟种列表和观鸟记录
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
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
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4" />
                  {exportingPdf ? "生成中..." : "生成报告"}
                </button>
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
                导出所有观鸟数据的完整JSON备份，可用于数据迁移或恢复
              </p>

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

        <div className="card p-5 bg-amber-50/50 border-amber-200">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">数据安全提示</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• 数据存储在浏览器本地，清除浏览器数据会导致数据丢失</li>
                <li>• 建议定期导出备份，防止数据意外丢失</li>
                <li>• 导入备份将覆盖现有所有数据，请谨慎操作</li>
                <li>• 照片以Base64格式存储，可能会占用较大存储空间</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
