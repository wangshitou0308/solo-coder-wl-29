import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Search,
  MapPin,
  Clock,
  Users,
  Cloud,
  Leaf,
  Feather,
  Camera,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { LoadingSpinner } from "@/components/Common";
import {
  HabitatTypeLabels,
  WeatherOptions,
  BehaviorOptions,
} from "@/types";
import type {
  HabitatType,
  BirdObservation,
  BirdSpecies,
  BirdingJournal,
} from "@/types";
import { toLocalInputDateTime } from "@/utils/date";

interface ObservationForm {
  id?: string;
  species_id: string;
  count: number;
  behavior: string;
  photo_url?: string;
  notes: string;
  created_at?: string;
}

export default function JournalForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { init, getJournalDetails, upsertJournal, searchSpecies, loading, allSpecies } = useAppStore();

  const [journal, setJournal] = useState<Partial<BirdingJournal>>({
    location: "",
    weather: "",
    habitat_type: "forest" as HabitatType,
    companions: "",
    start_time: toLocalInputDateTime(),
    end_time: toLocalInputDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000)),
    notes: "",
  });

  const [observations, setObservations] = useState<ObservationForm[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [searchResults, setSearchResults] = useState<BirdSpecies[]>([]);
  const [currentObsIndex, setCurrentObsIndex] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (isEdit && id) {
      loadJournal();
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (speciesSearch.trim()) {
      doSearch();
    } else {
      setSearchResults(allSpecies.slice(0, 20));
    }
  }, [speciesSearch, allSpecies]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSpeciesPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadJournal = async () => {
    if (!id) return;
    setLoadingDetail(true);
    const result = await getJournalDetails(id);
    if (result.journal) {
      setJournal(result.journal);
      setObservations(
        (result.observations || []).map((o) => ({
          id: o.id,
          species_id: o.species_id,
          count: o.count,
          behavior: o.behavior,
          photo_url: o.photo_url,
          notes: o.notes,
          created_at: o.created_at,
        }))
      );
    }
    setLoadingDetail(false);
  };

  const doSearch = async () => {
    const results = await searchSpecies(speciesSearch);
    setSearchResults(results.slice(0, 30));
  };

  const handleAddObservation = () => {
    setObservations([
      ...observations,
      {
        species_id: "",
        count: 1,
        behavior: "",
        notes: "",
      },
    ]);
  };

  const handleRemoveObservation = (index: number) => {
    setObservations(observations.filter((_, i) => i !== index));
  };

  const handleObservationChange = (index: number, field: keyof ObservationForm, value: any) => {
    const newObs = [...observations];
    newObs[index] = { ...newObs[index], [field]: value };
    setObservations(newObs);
  };

  const openSpeciesPicker = (index: number) => {
    setCurrentObsIndex(index);
    setSpeciesSearch("");
    setSearchResults(allSpecies.slice(0, 20));
    setShowSpeciesPicker(true);
  };

  const selectSpecies = (species: BirdSpecies) => {
    if (currentObsIndex !== null) {
      handleObservationChange(currentObsIndex, "species_id", species.id);
    }
    setShowSpeciesPicker(false);
    setSpeciesSearch("");
  };

  const getSpeciesById = (speciesId: string): BirdSpecies | undefined => {
    return allSpecies.find((s) => s.id === speciesId);
  };

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      handleObservationChange(index, "photo_url", result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    handleObservationChange(index, "photo_url", undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journal.location?.trim()) {
      alert("请输入观鸟地点");
      return;
    }
    if (observations.some((o) => !o.species_id)) {
      alert("请为每条观察记录选择鸟种");
      return;
    }

    setSaving(true);
    try {
      const journalData: BirdingJournal = {
        id: id || "",
        location: journal.location || "",
        latitude: journal.latitude,
        longitude: journal.longitude,
        weather: journal.weather || "",
        habitat_type: journal.habitat_type || "forest",
        companions: journal.companions || "",
        start_time: new Date(journal.start_time || new Date()).toISOString(),
        end_time: new Date(journal.end_time || new Date()).toISOString(),
        notes: journal.notes || "",
        created_at: (journal as any).created_at || "",
        updated_at: "",
      };

      const obsData: BirdObservation[] = observations.map((o) => ({
        id: o.id || "",
        journal_id: id || "",
        species_id: o.species_id,
        count: o.count,
        behavior: o.behavior,
        photo_url: o.photo_url,
        notes: o.notes,
        created_at: o.created_at || "",
      }));

      await upsertJournal(journalData, obsData);
      navigate(isEdit ? `/journal/${id}` : "/journal");
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    }
    setSaving(false);
  };

  if (loadingDetail) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-slide-up pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost !p-2 !min-h-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-2xl font-bold text-earth-800">
          {isEdit ? "编辑日记" : "新建日记"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-5 space-y-4">
          <h2 className="section-title mb-2">
            <MapPin className="w-5 h-5 text-olive-600" />
            基本信息
          </h2>

          <div>
            <label className="label">观鸟地点 *</label>
            <input
              type="text"
              value={journal.location}
              onChange={(e) => setJournal({ ...journal, location: e.target.value })}
              placeholder="例如：奥林匹克森林公园"
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <Cloud className="w-4 h-4 inline mr-1" />
                天气
              </label>
              <select
                value={journal.weather}
                onChange={(e) => setJournal({ ...journal, weather: e.target.value })}
                className="input"
              >
                <option value="">选择天气</option>
                {WeatherOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                <Leaf className="w-4 h-4 inline mr-1" />
                栖息地类型
              </label>
              <select
                value={journal.habitat_type}
                onChange={(e) =>
                  setJournal({ ...journal, habitat_type: e.target.value as HabitatType })
                }
                className="input"
              >
                {Object.entries(HabitatTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <Clock className="w-4 h-4 inline mr-1" />
                开始时间
              </label>
              <input
                type="datetime-local"
                value={toLocalInputDateTime(new Date(journal.start_time))}
                onChange={(e) =>
                  setJournal({ ...journal, start_time: new Date(e.target.value).toISOString() })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">
                <Clock className="w-4 h-4 inline mr-1" />
                结束时间
              </label>
              <input
                type="datetime-local"
                value={toLocalInputDateTime(new Date(journal.end_time))}
                onChange={(e) =>
                  setJournal({ ...journal, end_time: new Date(e.target.value).toISOString() })
                }
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">
              <Users className="w-4 h-4 inline mr-1" />
              同行伙伴
            </label>
            <input
              type="text"
              value={journal.companions}
              onChange={(e) => setJournal({ ...journal, companions: e.target.value })}
              placeholder="多人用逗号分隔，例如：张三, 李四"
              className="input"
            />
          </div>

          <div>
            <label className="label">观察笔记</label>
            <textarea
              value={journal.notes}
              onChange={(e) => setJournal({ ...journal, notes: e.target.value })}
              placeholder="记录今天的观鸟感受、特殊发现等..."
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title mb-0">
              <Feather className="w-5 h-5 text-olive-600" />
              观察记录
              <span className="text-sm font-normal text-earth-500 ml-2">
                ({observations.length} 条)
              </span>
            </h2>
            <button
              type="button"
              onClick={handleAddObservation}
              className="btn-secondary text-sm !py-2 !px-4 !min-h-0"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>

          {observations.length === 0 ? (
            <div className="text-center py-8 text-earth-400">
              <Feather className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>还没有添加观察记录</p>
              <p className="text-sm">点击上方"添加"按钮开始记录鸟种</p>
            </div>
          ) : (
            <div className="space-y-4">
              {observations.map((obs, index) => {
                const species = getSpeciesById(obs.species_id);
                return (
                  <div
                    key={index}
                    className="border border-cream-200 rounded-xl p-4 bg-cream-50/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="chip-olive">第 {index + 1} 条</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveObservation(index)}
                        className="text-earth-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative mb-3" ref={currentObsIndex === index ? searchRef : undefined}>
                      <label className="label">鸟种 *</label>
                      <button
                        type="button"
                        onClick={() => openSpeciesPicker(index)}
                        className="input text-left flex items-center justify-between"
                      >
                        {species ? (
                          <span className="text-earth-800">
                            {species.name_cn}
                            <span className="text-earth-400 text-sm ml-2">
                              {species.name_latin}
                            </span>
                          </span>
                        ) : (
                          <span className="text-earth-400">点击选择鸟种</span>
                        )}
                        <ChevronDown className="w-5 h-5 text-earth-400" />
                      </button>

                      {showSpeciesPicker && currentObsIndex === index && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-cream-200 max-h-64 overflow-y-auto">
                          <div className="p-2 border-b border-cream-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
                              <input
                                type="text"
                                value={speciesSearch}
                                onChange={(e) => setSpeciesSearch(e.target.value)}
                                placeholder="搜索鸟种..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-olive-400/50"
                                autoFocus
                              />
                            </div>
                          </div>
                          <div className="py-1">
                            {searchResults.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-earth-400 text-center">
                                没有找到匹配的鸟种
                              </div>
                            ) : (
                              searchResults.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => selectSpecies(s)}
                                  className="w-full px-4 py-2 text-left hover:bg-cream-50 text-sm flex items-center justify-between"
                                >
                                  <div>
                                    <div className="text-earth-800 font-medium">{s.name_cn}</div>
                                    <div className="text-earth-400 text-xs">{s.name_latin}</div>
                                  </div>
                                  <span className="chip-cream text-xs">
                                    {HabitatTypeLabels[s.habitat_type]}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="label">数量</label>
                        <input
                          type="number"
                          min="1"
                          value={obs.count}
                          onChange={(e) =>
                            handleObservationChange(index, "count", parseInt(e.target.value) || 1)
                          }
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">行为</label>
                        <select
                          value={obs.behavior}
                          onChange={(e) => handleObservationChange(index, "behavior", e.target.value)}
                          className="input"
                        >
                          <option value="">选择行为</option>
                          {BehaviorOptions.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="label">
                        <Camera className="w-4 h-4 inline mr-1" />
                        照片
                      </label>
                      {obs.photo_url ? (
                        <div className="relative inline-block">
                          <img
                            src={obs.photo_url}
                            alt="观察照片"
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentObsIndex(index);
                            fileInputRef.current?.click();
                          }}
                          className="w-24 h-24 rounded-lg border-2 border-dashed border-cream-300 flex flex-col items-center justify-center text-earth-400 hover:border-olive-400 hover:text-olive-600 transition-colors"
                        >
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-xs">添加照片</span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (currentObsIndex !== null) {
                            handlePhotoUpload(currentObsIndex, e);
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="label">备注</label>
                      <input
                        type="text"
                        value={obs.notes}
                        onChange={(e) => handleObservationChange(index, "notes", e.target.value)}
                        placeholder="关于这次观察的备注..."
                        className="input"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream-100/95 backdrop-blur-md border-t border-cream-200 md:relative md:bg-transparent md:border-0 md:p-0">
          <div className="container flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "保存日记"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
