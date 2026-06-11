import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  Camera,
  Plus,
  Edit3,
  Trash2,
  X,
  Calendar,
  Zap,
  Aperture,
  Package,
  Save,
} from "lucide-react";
import { LoadingSpinner, EmptyState, PageHeader } from "@/components/Common";
import {
  EquipmentTypeLabels,
} from "@/types";
import type { Equipment, EquipmentType } from "@/types";
import { formatDate, toLocalInputDate } from "@/utils/date";

export default function Equipment() {
  const { init, loading, equipment, upsertEquipment, deleteEquipment } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<Partial<Equipment>>({
    type: "binoculars" as EquipmentType,
    brand: "",
    model: "",
    purchase_date: "",
    usage_count: 0,
    shutter_count: undefined,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const handleAdd = () => {
    setEditingEquipment(null);
    setFormData({
      type: "binoculars" as EquipmentType,
      brand: "",
      model: "",
      purchase_date: toLocalInputDate(),
      usage_count: 0,
      shutter_count: undefined,
      notes: "",
    });
    setShowModal(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormData({ ...eq });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("确定要删除这件装备吗？")) {
      await deleteEquipment(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand?.trim() || !formData.model?.trim()) {
      alert("请填写品牌和型号");
      return;
    }

    setSaving(true);
    try {
      await upsertEquipment(formData as Equipment);
      setShowModal(false);
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    }
    setSaving(false);
  };

  const getEquipmentIcon = (type: EquipmentType) => {
    switch (type) {
      case "binoculars":
        return <Aperture className="w-6 h-6" />;
      case "camera":
        return <Camera className="w-6 h-6" />;
      case "lens":
        return <Zap className="w-6 h-6" />;
      case "tripod":
        return <Package className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  const getEquipmentColor = (type: EquipmentType) => {
    switch (type) {
      case "binoculars":
        return "from-olive-400 to-olive-600";
      case "camera":
        return "from-earth-400 to-earth-600";
      case "lens":
        return "from-amber-400 to-amber-600";
      case "tripod":
        return "from-cream-400 to-cream-500";
      default:
        return "from-olive-400 to-olive-600";
    }
  };

  if (loading && !equipment.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-slide-up pb-24">
      <PageHeader
        title="装备管理"
        subtitle="记录你的观鸟装备"
      >
        <button onClick={handleAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          添加装备
        </button>
      </PageHeader>

      {equipment.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="还没有装备记录"
          description="添加你的观鸟装备，记录使用情况"
          action={
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="w-4 h-4" /> 添加装备
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {equipment.map((eq) => (
            <div key={eq.id} className="card card-hover p-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getEquipmentColor(
                    eq.type
                  )} flex items-center justify-center shadow-md flex-shrink-0 text-white`}
                >
                  {getEquipmentIcon(eq.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-earth-800">
                        {eq.brand} {eq.model}
                      </h3>
                      <span className="chip-olive text-xs mt-1 inline-block">
                        {EquipmentTypeLabels[eq.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(eq)}
                        className="p-2 text-earth-400 hover:text-olive-600 rounded-lg hover:bg-cream-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(eq.id)}
                        className="p-2 text-earth-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-earth-500">
                    {eq.purchase_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        购入：{formatDate(eq.purchase_date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      使用 {eq.usage_count} 次
                    </span>
                    {eq.type === "camera" && eq.shutter_count !== undefined && (
                      <span className="flex items-center gap-1">
                        <Aperture className="w-4 h-4" />
                        快门 {eq.shutter_count.toLocaleString()} 次
                      </span>
                    )}
                  </div>

                  {eq.notes && (
                    <p className="text-sm text-earth-500 mt-2 line-clamp-2">
                      {eq.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream-100/95 backdrop-blur-md border-t border-cream-200 md:hidden">
        <div className="container">
          <button onClick={handleAdd} className="btn-primary w-full">
            <Plus className="w-4 h-4" />
            添加装备
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-cream-200">
              <h2 className="font-serif text-xl font-bold text-earth-800">
                {editingEquipment ? "编辑装备" : "添加装备"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-earth-400 hover:text-earth-600 rounded-lg hover:bg-cream-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="label">装备类型</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as EquipmentType })
                  }
                  className="input"
                >
                  {Object.entries(EquipmentTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">品牌</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="例如：蔡司"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">型号</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="例如：征服者HD"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">购买日期</label>
                  <input
                    type="date"
                    value={formData.purchase_date ? toLocalInputDate(new Date(formData.purchase_date)) : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_date: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : "",
                      })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">使用次数</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usage_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usage_count: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input"
                  />
                </div>
              </div>

              {formData.type === "camera" && (
                <div>
                  <label className="label">快门次数</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.shutter_count ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shutter_count: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="相机快门次数"
                    className="input"
                  />
                </div>
              )}

              <div>
                <label className="label">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="关于这件装备的备注..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  <Save className="w-4 h-4" />
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
