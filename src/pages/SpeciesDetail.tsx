import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  ArrowLeft,
  Feather,
  MapPin,
  Calendar,
  Star,
  Check,
  Clock,
  ChevronRight,
  Plus,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  X,
} from "lucide-react";
import { LoadingSpinner, EmptyState } from "@/components/Common";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
  ConservationStatusLabels,
} from "@/types";
import type { BirdSpecies } from "@/types";
import { formatDate } from "@/utils/date";
import { getSpeciesDetailStats, buildTaxonomyMaps, type SpeciesDetailStats } from "@/utils/stats";

export default function SpeciesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    init,
    allSpecies,
    allFamilies,
    allGenera,
    orders,
    userSpeciesRecords,
    observations,
    journals,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistItem,
  } = useAppStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doInit = async () => {
      await init();
      setLoading(false);
    };
    doInit();
  }, [init]);

  const species = useMemo<BirdSpecies | null>(() => {
    if (!id) return null;
    return allSpecies.find((s) => s.id === id) || null;
  }, [allSpecies, id]);

  const taxonomyInfo = useMemo(() => {
    if (!species) return { orderName: "", familyName: "", genusName: "" };
    const { speciesToGenus, speciesToFamily, speciesToOrder, genusMap, familyMap } =
      buildTaxonomyMaps(allSpecies, allFamilies, allGenera);

    const genus = speciesToGenus.get(species.id);
    const family = speciesToFamily.get(species.id);
    const order = speciesToOrder.get(species.id);

    const orderName = order ? order.name_cn : orders.find((o) => {
      const f = family || (genus ? familyMap.get(genus.family_id) : null);
      return f ? o.id === f.order_id : false;
    })?.name_cn || "";

    return {
      orderName,
      familyName: family?.name_cn || "",
      genusName: genus?.name_cn || "",
    };
  }, [species, allSpecies, allFamilies, allGenera, orders]);

  const userRecord = useMemo(() => {
    if (!id) return null;
    return userSpeciesRecords.find((r) => r.species_id === id) || null;
  }, [userSpeciesRecords, id]);

  const stats: SpeciesDetailStats = useMemo(() => {
    if (!id) {
      return {
        firstObservedAt: null,
        firstLocation: null,
        lastObservedAt: null,
        lastLocation: null,
        totalObservations: 0,
        totalIndividuals: 0,
        locations: [],
      };
    }
    return getSpeciesDetailStats(id, observations, journals, userSpeciesRecords);
  }, [id, observations, journals, userSpeciesRecords]);

  const speciesObservations = useMemo(() => {
    if (!id) return [];
    const journalMap = new Map(journals.map((j) => [j.id, j]));
    return observations
      .filter((o) => o.species_id === id)
      .map((o) => ({
        observation: o,
        journal: journalMap.get(o.journal_id),
      }))
      .filter((x) => x.journal)
      .sort(
        (a, b) =>
          new Date(b.journal!.start_time).getTime() -
          new Date(a.journal!.start_time).getTime()
      );
  }, [id, observations, journals]);

  const wishlisted = id ? isInWishlist(id) : false;
  const wishlistItem = id ? getWishlistItem(id) : undefined;
  const wishlistCompleted = wishlistItem?.completed_at;

  const toggleWishlist = () => {
    if (!id) return;
    if (wishlisted) {
      removeFromWishlist(id);
    } else {
      addToWishlist(id);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!species) {
    return (
      <EmptyState
        icon={Feather}
        title="鸟种不存在"
        description="没有找到这种鸟类的信息"
        action={
          <Link to="/species" className="btn-primary">
            返回图鉴
          </Link>
        }
      />
    );
  }

  const isObserved = !!userRecord;

  return (
    <div className="animate-slide-up pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost !p-2 !min-h-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-earth-500 truncate">
            {taxonomyInfo.orderName} / {taxonomyInfo.familyName} / {taxonomyInfo.genusName}
          </p>
        </div>
        <button
          onClick={toggleWishlist}
          className={`btn-ghost !p-2 !min-h-0 ${
            wishlisted ? "text-amber-500" : "text-earth-400"
          }`}
          title={wishlisted ? "移出愿望清单" : "加入愿望清单"}
        >
          <Star className={`w-5 h-5 ${wishlisted ? "fill-amber-500" : ""}`} />
        </button>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isObserved
                ? "bg-gradient-to-br from-olive-400 to-olive-600"
                : "bg-cream-200"
            }`}
          >
            {isObserved ? (
              <Check className="w-10 h-10 text-white" />
            ) : (
              <Feather className="w-10 h-10 text-earth-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-2xl font-bold text-earth-800">
                {species.name_cn}
              </h1>
              {species.is_common && <span className="chip-olive">常见</span>}
              {isObserved && <span className="chip-olive">已观察</span>}
              {wishlisted && (
                <span
                  className={`chip ${
                    wishlistCompleted
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <Star className="w-3 h-3 mr-1 inline" />
                  {wishlistCompleted ? "愿望已达成" : "愿望清单"}
                </span>
              )}
            </div>
            <p className="text-earth-500 italic mt-1">{species.name_latin}</p>
            {species.common_name && (
              <p className="text-sm text-earth-400 mt-1">又名：{species.common_name}</p>
            )}
            {wishlisted && wishlistCompleted && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Award className="w-3 h-3" />
                完成时间：{formatDate(wishlistCompleted)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="text-center p-3 bg-cream-50 rounded-xl">
            <p className="text-xs text-earth-500 mb-1">栖息地</p>
            <p className="font-medium text-earth-800 text-sm">
              {HabitatTypeLabels[species.habitat_type]}
            </p>
          </div>
          <div className="text-center p-3 bg-cream-50 rounded-xl">
            <p className="text-xs text-earth-500 mb-1">居留型</p>
            <p className="font-medium text-earth-800 text-sm">
              {ResidenceTypeLabels[species.residence_type]}
            </p>
          </div>
          <div className="text-center p-3 bg-cream-50 rounded-xl">
            <p className="text-xs text-earth-500 mb-1">保护级别</p>
            <p
              className={`font-medium text-sm ${
                species.conservation_status === "LC"
                  ? "text-green-600"
                  : species.conservation_status === "NT"
                  ? "text-yellow-600"
                  : species.conservation_status === "VU"
                  ? "text-orange-600"
                  : "text-red-600"
              }`}
            >
              {ConservationStatusLabels[species.conservation_status]}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-earth-800 mb-2">物种描述</h3>
          <p className="text-earth-600 text-sm leading-relaxed">
            {species.description}
          </p>
        </div>
      </div>

      {isObserved ? (
        <>
          <div className="card p-5 mb-6">
            <h2 className="section-title mb-4">
              <TrendingUp className="w-5 h-5 text-olive-600" />
              观察统计
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-3 bg-olive-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-olive-600" />
                  <p className="text-xs text-earth-500">首次观察</p>
                </div>
                <p className="font-medium text-earth-800 text-sm">
                  {stats.firstObservedAt ? formatDate(stats.firstObservedAt) : "-"}
                </p>
                <p className="text-xs text-earth-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {stats.firstLocation || "未记录地点"}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-earth-500">最近观察</p>
                </div>
                <p className="font-medium text-earth-800 text-sm">
                  {stats.lastObservedAt ? formatDate(stats.lastObservedAt) : "-"}
                </p>
                <p className="text-xs text-earth-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {stats.lastLocation || "未记录地点"}
                </p>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <p className="text-xs text-earth-500">总观察次数</p>
                </div>
                <p className="font-semibold text-2xl text-earth-800">
                  {stats.totalObservations}
                </p>
                <p className="text-xs text-earth-500">次记录</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <p className="text-xs text-earth-500">总观察个体数</p>
                </div>
                <p className="font-semibold text-2xl text-earth-800">
                  {stats.totalIndividuals}
                </p>
                <p className="text-xs text-earth-500">只</p>
              </div>
            </div>

            {stats.locations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-earth-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  出现地点
                </h3>
                <div className="space-y-2">
                  {stats.locations.map((loc) => (
                    <div
                      key={loc.location}
                      className="flex items-center justify-between p-3 bg-cream-50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-earth-800 text-sm truncate">
                          {loc.location}
                        </p>
                        <p className="text-xs text-earth-500 mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {loc.count} 次
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(loc.lastSeen)}
                          </span>
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <div className="text-xs text-earth-400 mb-1">频次</div>
                        <div className="flex gap-0.5">
                          {Array.from({
                            length: Math.min(5, Math.ceil((loc.count / Math.max(...stats.locations.map((l) => l.count))) * 5)),
                          }).map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-4 rounded-sm bg-olive-400"
                            />
                          ))}
                          {Array.from({
                            length: Math.max(
                              0,
                              5 -
                                Math.min(
                                  5,
                                  Math.ceil((loc.count / Math.max(...stats.locations.map((l) => l.count))) * 5)
                                )
                            ),
                          }).map((_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="w-2 h-4 rounded-sm bg-cream-200"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {speciesObservations.length > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="section-title mb-4">
                <BookOpen className="w-5 h-5 text-sky-600" />
                观察历史
              </h2>
              <div className="space-y-2">
                {speciesObservations.slice(0, 20).map(({ observation, journal }) => (
                  <Link
                    key={observation.id}
                    to={`/journal/${journal!.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 transition-colors border border-transparent hover:border-cream-200"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-earth-800 text-sm">
                          {formatDate(journal!.start_time)}
                        </p>
                        {observation.count > 1 && (
                          <span className="chip-olive !py-0 !px-2 text-xs">
                            {observation.count} 只
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-earth-500">
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {journal!.location || "未命名地点"}
                          </span>
                        </span>
                        {observation.behavior && (
                          <>
                            <span>·</span>
                            <span>{observation.behavior}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-earth-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
              {speciesObservations.length > 20 && (
                <p className="text-center text-xs text-earth-400 mt-3">
                  共 {speciesObservations.length} 条记录，显示最近 20 条
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="card p-6 mb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-3">
            <Feather className="w-8 h-8 text-earth-400" />
          </div>
          <h3 className="font-medium text-earth-700 mb-1">还没有观察记录</h3>
          <p className="text-sm text-earth-500 mb-4">
            去观鸟日记中添加这种鸟的观察记录吧
          </p>
          <Link to="/journal/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            记录观察
          </Link>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream-100/95 backdrop-blur-md border-t border-cream-200 md:hidden">
        <div className="container flex gap-3">
          <button
            onClick={toggleWishlist}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              wishlisted
                ? "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200"
                : "btn-secondary"
            }`}
          >
            {wishlisted ? (
              <>
                <X className="w-4 h-4" />
                移出愿望清单
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                加入愿望清单
              </>
            )}
          </button>
          <Link to="/journal/new" className="btn-primary flex-1">
            <Plus className="w-4 h-4" />
            记录观察
          </Link>
        </div>
      </div>
    </div>
  );
}
