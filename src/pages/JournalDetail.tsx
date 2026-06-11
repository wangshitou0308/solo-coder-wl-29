import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Users,
  Cloud,
  Leaf,
  Feather,
  Camera,
  ChevronRight,
} from "lucide-react";
import { LoadingSpinner, EmptyState } from "@/components/Common";
import { formatDate, formatDuration } from "@/utils/date";
import {
  HabitatTypeLabels,
  BehaviorOptions,
} from "@/types";
import type { BirdObservation, BirdSpecies } from "@/types";

export default function JournalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { init, getJournalDetails, deleteJournal, allSpecies, loading } = useAppStore();
  const [journal, setJournal] = useState<any>(null);
  const [observations, setObservations] = useState<BirdObservation[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (id) {
      loadJournal();
    }
  }, [id]);

  const loadJournal = async () => {
    if (!id) return;
    setLoadingDetail(true);
    const result = await getJournalDetails(id);
    setJournal(result.journal);
    setObservations(result.observations || []);
    setLoadingDetail(false);
  };

  const getSpeciesById = (speciesId: string): BirdSpecies | undefined => {
    return allSpecies.find((s) => s.id === speciesId);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("确定要删除这篇日记吗？相关的观察记录也会被删除。")) {
      await deleteJournal(id);
      navigate("/journal");
    }
  };

  if (loadingDetail || loading) {
    return <LoadingSpinner />;
  }

  if (!journal) {
    return <EmptyState icon={Calendar} title="日记不存在" description="这篇日记可能已被删除" />;
  }

  const totalBirds = observations.reduce((sum, o) => sum + o.count, 0);
  const uniqueSpecies = new Set(observations.map((o) => o.species_id)).size;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost !p-2 !min-h-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl font-bold text-earth-800 truncate">
            {journal.location || "未命名地点"}
          </h1>
          <p className="text-sm text-earth-500">{formatDate(journal.start_time, true)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/journal/${id}/edit`} className="btn-ghost !p-2 !min-h-0">
            <Edit3 className="w-5 h-5" />
          </Link>
          <button onClick={handleDelete} className="btn-ghost !p-2 !min-h-0 text-red-500 hover:text-red-600">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-olive-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-olive-700" />
            </div>
            <div>
              <p className="text-xs text-earth-500">地点</p>
              <p className="font-medium text-earth-800 text-sm">{journal.location || "-"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Cloud className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-earth-500">天气</p>
              <p className="font-medium text-earth-800 text-sm">{journal.weather || "-"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-earth-500">栖息地</p>
              <p className="font-medium text-earth-800 text-sm">
                {HabitatTypeLabels[journal.habitat_type] || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-earth-500">时长</p>
              <p className="font-medium text-earth-800 text-sm">
                {formatDuration(journal.start_time, journal.end_time)}
              </p>
            </div>
          </div>
        </div>

        {journal.companions && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-cream-200">
            <Users className="w-5 h-5 text-earth-400" />
            <div>
              <p className="text-xs text-earth-500">同行伙伴</p>
              <p className="font-medium text-earth-800 text-sm">{journal.companions}</p>
            </div>
          </div>
        )}

        {journal.notes && (
          <div className="mt-4 pt-4 border-t border-cream-200">
            <p className="text-xs text-earth-500 mb-2">观察笔记</p>
            <p className="text-earth-700 text-sm leading-relaxed whitespace-pre-wrap">
              {journal.notes}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">
          <Feather className="w-5 h-5 text-olive-600" />
          观察记录
          <span className="text-sm font-normal text-earth-500 ml-2">
            {uniqueSpecies} 种 / {totalBirds} 只
          </span>
        </h2>
      </div>

      {observations.length === 0 ? (
        <EmptyState
          icon={Feather}
          title="没有观察记录"
          description="这篇日记还没有记录鸟种"
          action={
            <Link to={`/journal/${id}/edit`} className="btn-primary">
              <Edit3 className="w-4 h-4" /> 添加观察
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {observations.map((obs) => {
            const species = getSpeciesById(obs.species_id);
            return (
              <Link
                key={obs.id}
                to={species ? `/species/${species.id}` : "#"}
                className="card card-hover p-4 flex gap-4 items-center group"
              >
                {obs.photo_url ? (
                  <img
                    src={obs.photo_url}
                    alt={species?.name_cn || "观察照片"}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                    <Feather className="w-8 h-8 text-earth-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-earth-800 flex items-center gap-2">
                    {species?.name_cn || "未知鸟种"}
                    <span className="text-xs text-earth-400 font-normal">
                      {species?.name_latin}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-earth-500">
                    <span className="chip-olive">
                      {obs.count} 只
                    </span>
                    {obs.behavior && (
                      <span className="chip-cream">
                        {obs.behavior}
                      </span>
                    )}
                  </div>
                  {obs.notes && (
                    <p className="text-xs text-earth-500 mt-2 line-clamp-1">
                      {obs.notes}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-earth-300 flex-shrink-0 group-hover:text-olive-600 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
