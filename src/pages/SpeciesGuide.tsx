import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  Feather,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  Star,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  Target,
  Calendar,
  MapPin,
  X,
} from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/Common";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
  ConservationStatusLabels,
} from "@/types";
import type {
  BirdSpecies,
  HabitatType,
  ResidenceType,
  ObservedFilterType,
} from "@/types";
import {
  buildTaxonomyMaps,
  getRecommendedBirds,
  type RecommendedBird,
} from "@/utils/stats";

const OBSERVED_FILTER_OPTIONS: {
  value: ObservedFilterType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "all", label: "全部", icon: Feather },
  { value: "observed", label: "已观察", icon: Eye },
  { value: "unobserved", label: "未观察", icon: EyeOff },
  { value: "wishlist", label: "愿望清单", icon: Star },
  { value: "common", label: "常见鸟", icon: Target },
];

const REASON_TYPE_STYLES: Record<
  RecommendedBird["reasonType"],
  { chip: string; bg: string; iconColor: string }
> = {
  common_unobserved: {
    chip: "bg-amber-100 text-amber-800",
    bg: "from-amber-50 to-orange-50",
    iconColor: "text-amber-600",
  },
  seasonal: {
    chip: "bg-sky-100 text-sky-800",
    bg: "from-sky-50 to-cyan-50",
    iconColor: "text-sky-600",
  },
  same_habitat: {
    chip: "bg-emerald-100 text-emerald-800",
    bg: "from-emerald-50 to-green-50",
    iconColor: "text-emerald-600",
  },
};

const REASON_TYPE_ICONS: Record<RecommendedBird["reasonType"], React.ElementType> = {
  common_unobserved: Target,
  seasonal: Calendar,
  same_habitat: MapPin,
};

export default function SpeciesGuide() {
  const navigate = useNavigate();
  const {
    init,
    loading,
    orders,
    allSpecies,
    allFamilies,
    allGenera,
    userSpeciesRecords,
    journals,
    observations,
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterHabitat, setFilterHabitat] = useState<HabitatType | "all">("all");
  const [filterResidence, setFilterResidence] = useState<ResidenceType | "all">("all");
  const [observedFilters, setObservedFilters] = useState<Set<ObservedFilterType>>(
    new Set(["all"])
  );

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [expandedGenera, setExpandedGenera] = useState<Set<string>>(new Set());

  useEffect(() => {
    init();
  }, [init]);

  const observedSpeciesIds = useMemo(
    () => new Set(userSpeciesRecords.map((r) => r.species_id)),
    [userSpeciesRecords]
  );

  const wishlistSpeciesIds = useMemo(
    () => new Set(wishlist.map((w) => w.species_id)),
    [wishlist]
  );

  const taxonomyMaps = useMemo(
    () => buildTaxonomyMaps(allSpecies, allFamilies, allGenera),
    [allSpecies, allFamilies, allGenera]
  );

  const {
    speciesByGenus,
    speciesByFamily,
    speciesByOrder,
    genusMap,
    familyMap,
  } = taxonomyMaps;

  const generaByFamily = useMemo(() => {
    const map = new Map<string, typeof allGenera>();
    for (const genus of allGenera) {
      if (!map.has(genus.family_id)) {
        map.set(genus.family_id, []);
      }
      map.get(genus.family_id)!.push(genus);
    }
    return map;
  }, [allGenera]);

  const familiesByOrder = useMemo(() => {
    const map = new Map<string, typeof allFamilies>();
    for (const family of allFamilies) {
      if (!map.has(family.order_id)) {
        map.set(family.order_id, []);
      }
      map.get(family.order_id)!.push(family);
    }
    return map;
  }, [allFamilies]);

  const recommendedBirds = useMemo(
    () => getRecommendedBirds(allSpecies, userSpeciesRecords, journals, observations, 6),
    [allSpecies, userSpeciesRecords, journals, observations]
  );

  const toggleObservedFilter = (filter: ObservedFilterType) => {
    const newFilters = new Set(observedFilters);
    if (filter === "all") {
      setObservedFilters(new Set(["all"]));
      return;
    }
    newFilters.delete("all");
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
      if (newFilters.size === 0) {
        newFilters.add("all");
      }
    } else {
      newFilters.add(filter);
    }
    setObservedFilters(newFilters);
  };

  const matchesObservedFilter = (species: BirdSpecies): boolean => {
    if (observedFilters.has("all")) return true;
    const isObserved = observedSpeciesIds.has(species.id);
    const isWishlist = wishlistSpeciesIds.has(species.id);
    const isCommon = species.is_common;

    if (observedFilters.has("observed") && isObserved) return true;
    if (observedFilters.has("unobserved") && !isObserved) return true;
    if (observedFilters.has("wishlist") && isWishlist) return true;
    if (observedFilters.has("common") && isCommon) return true;

    return false;
  };

  const filteredSpecies = useMemo(() => {
    return allSpecies.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.name_cn.includes(searchQuery) ||
        s.name_latin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.common_name && s.common_name.includes(searchQuery));
      const matchHabitat = filterHabitat === "all" || s.habitat_type === filterHabitat;
      const matchResidence =
        filterResidence === "all" || s.residence_type === filterResidence;
      const matchObserved = matchesObservedFilter(s);
      return matchSearch && matchHabitat && matchResidence && matchObserved;
    });
  }, [allSpecies, searchQuery, filterHabitat, filterResidence, observedFilters]);

  const isSearchMode =
    searchQuery ||
    filterHabitat !== "all" ||
    filterResidence !== "all" ||
    !observedFilters.has("all");

  const getSpeciesCountForOrder = (orderId: string): number => {
    return speciesByOrder.get(orderId)?.length || 0;
  };

  const getGenusCountForOrder = (orderId: string): number => {
    const families = familiesByOrder.get(orderId) || [];
    let count = 0;
    for (const family of families) {
      count += generaByFamily.get(family.id)?.length || 0;
    }
    return count;
  };

  const getFamilyCountForOrder = (orderId: string): number => {
    return familiesByOrder.get(orderId)?.length || 0;
  };

  const getSpeciesCountForFamily = (familyId: string): number => {
    return speciesByFamily.get(familyId)?.length || 0;
  };

  const getGenusCountForFamily = (familyId: string): number => {
    return generaByFamily.get(familyId)?.length || 0;
  };

  const getSpeciesCountForGenus = (genusId: string): number => {
    return speciesByGenus.get(genusId)?.length || 0;
  };

  const getObservedCountForOrder = (orderId: string): number => {
    const speciesList = speciesByOrder.get(orderId) || [];
    return speciesList.filter((s) => observedSpeciesIds.has(s.id)).length;
  };

  const getObservedCountForFamily = (familyId: string): number => {
    const speciesList = speciesByFamily.get(familyId) || [];
    return speciesList.filter((s) => observedSpeciesIds.has(s.id)).length;
  };

  const getObservedCountForGenus = (genusId: string): number => {
    const speciesList = speciesByGenus.get(genusId) || [];
    return speciesList.filter((s) => observedSpeciesIds.has(s.id)).length;
  };

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const toggleFamily = (familyId: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId);
    } else {
      newExpanded.add(familyId);
    }
    setExpandedFamilies(newExpanded);
  };

  const toggleGenus = (genusId: string) => {
    const newExpanded = new Set(expandedGenera);
    if (newExpanded.has(genusId)) {
      newExpanded.delete(genusId);
    } else {
      newExpanded.add(genusId);
    }
    setExpandedGenera(newExpanded);
  };

  const toggleWishlist = (speciesId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isInWishlist(speciesId)) {
      removeFromWishlist(speciesId);
    } else {
      addToWishlist(speciesId);
    }
  };

  if (loading && !orders.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="鸟类图鉴"
        subtitle={`已点亮 ${observedSpeciesIds.size} / ${allSpecies.length} 种`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-olive-400 to-olive-600 flex items-center justify-center shadow-md">
          <Feather className="w-7 h-7 text-white" />
        </div>
      </PageHeader>

      {recommendedBirds.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-serif text-lg font-semibold text-earth-800">
              推荐目标鸟
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedBirds.map((rec) => (
              <RecommendedBirdCard
                key={rec.species.id}
                rec={rec}
                observed={observedSpeciesIds.has(rec.species.id)}
                inWishlist={wishlistSpeciesIds.has(rec.species.id)}
                onToggleWishlist={(e) => toggleWishlist(rec.species.id, e)}
                onClick={() => navigate(`/species/${rec.species.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
          <input
            type="text"
            placeholder="搜索鸟种名称、学名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-cream-200 transition-colors"
            >
              <X className="w-4 h-4 text-earth-400" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-earth-500">
            <Filter className="w-3.5 h-3.5" />
            <span>观察状态组合筛选</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {OBSERVED_FILTER_OPTIONS.map(({ value, label, icon: Icon }) => {
              const isActive = observedFilters.has(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleObservedFilter(value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 min-h-[36px] ${
                    isActive
                      ? value === "all"
                        ? "bg-olive-600 text-white shadow-md"
                        : value === "observed"
                        ? "bg-emerald-600 text-white shadow-md"
                        : value === "unobserved"
                        ? "bg-earth-500 text-white shadow-md"
                        : value === "wishlist"
                        ? "bg-amber-500 text-white shadow-md"
                        : "bg-sky-500 text-white shadow-md"
                      : "bg-cream-100 text-earth-600 hover:bg-cream-200 border border-cream-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterHabitat}
            onChange={(e) => setFilterHabitat(e.target.value as HabitatType | "all")}
            className="input !py-2 !min-h-0 text-sm flex-1 min-w-[120px]"
          >
            <option value="all">全部栖息地</option>
            {Object.entries(HabitatTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filterResidence}
            onChange={(e) =>
              setFilterResidence(e.target.value as ResidenceType | "all")
            }
            className="input !py-2 !min-h-0 text-sm flex-1 min-w-[120px]"
          >
            <option value="all">全部居留型</option>
            {Object.entries(ResidenceTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isSearchMode ? (
        <div className="space-y-2">
          <p className="text-sm text-earth-500 mb-3">
            找到 {filteredSpecies.length} 种鸟类
          </p>
          {filteredSpecies.length === 0 ? (
            <div className="card p-8 text-center text-earth-400">
              <Feather className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>没有找到匹配的鸟种</p>
            </div>
          ) : (
            filteredSpecies.map((species) => (
              <SpeciesCard
                key={species.id}
                species={species}
                observed={observedSpeciesIds.has(species.id)}
                inWishlist={wishlistSpeciesIds.has(species.id)}
                onToggleWishlist={(e) => toggleWishlist(species.id, e)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const familyCount = getFamilyCountForOrder(order.id);
            const genusCount = getGenusCountForOrder(order.id);
            const speciesCount = getSpeciesCountForOrder(order.id);
            const observedCount = getObservedCountForOrder(order.id);
            const orderFamilies = familiesByOrder.get(order.id) || [];

            return (
              <div key={order.id} className="card overflow-hidden">
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-cream-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-olive-100 flex items-center justify-center flex-shrink-0">
                    <Feather className="w-5 h-5 text-olive-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-earth-800">{order.name_cn}</h3>
                    <p className="text-xs text-earth-400">{order.name_latin}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                      <div className="text-earth-600">
                        {familyCount} 科 · {genusCount} 属 · {speciesCount} 种
                      </div>
                      {observedCount > 0 && (
                        <div className="text-olive-600 font-medium mt-0.5">
                          已观察 {observedCount}/{speciesCount}
                        </div>
                      )}
                    </div>
                    {expandedOrders.has(order.id) ? (
                      <ChevronDown className="w-5 h-5 text-earth-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-earth-400 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {expandedOrders.has(order.id) &&
                  orderFamilies.map((family) => {
                    const familySpeciesCount = getSpeciesCountForFamily(family.id);
                    const familyGenusCount = getGenusCountForFamily(family.id);
                    const familyObservedCount = getObservedCountForFamily(family.id);
                    const familyGenera = generaByFamily.get(family.id) || [];

                    return (
                      <div key={family.id} className="border-t border-cream-100">
                        <button
                          onClick={() => toggleFamily(family.id)}
                          className="w-full p-3 pl-12 flex items-center gap-3 text-left hover:bg-cream-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-earth-700 text-sm">
                              {family.name_cn}
                            </h4>
                            <p className="text-xs text-earth-400">
                              {family.name_latin}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right text-xs">
                              <div className="text-earth-500">
                                {familyGenusCount} 属 · {familySpeciesCount} 种
                              </div>
                              {familyObservedCount > 0 && (
                                <div className="text-olive-600 font-medium mt-0.5">
                                  {familyObservedCount}/{familySpeciesCount}
                                </div>
                              )}
                            </div>
                            {expandedFamilies.has(family.id) ? (
                              <ChevronDown className="w-4 h-4 text-earth-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-earth-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {expandedFamilies.has(family.id) &&
                          familyGenera.map((genus) => {
                            const genusSpeciesCount = getSpeciesCountForGenus(
                              genus.id
                            );
                            const genusObservedCount = getObservedCountForGenus(
                              genus.id
                            );
                            const genusSpecies = speciesByGenus.get(genus.id) || [];

                            return (
                              <div
                                key={genus.id}
                                className="border-t border-cream-50"
                              >
                                <button
                                  onClick={() => toggleGenus(genus.id)}
                                  className="w-full p-2.5 pl-16 flex items-center gap-2 text-left hover:bg-cream-50 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-earth-700 text-sm">
                                      {genus.name_cn}
                                    </h5>
                                    <p className="text-xs text-earth-400">
                                      {genus.name_latin}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right text-xs">
                                      <div className="text-earth-500">
                                        {genusSpeciesCount} 种
                                      </div>
                                      {genusObservedCount > 0 && (
                                        <div className="text-olive-600 font-medium mt-0.5">
                                          {genusObservedCount}/{genusSpeciesCount}
                                        </div>
                                      )}
                                    </div>
                                    {expandedGenera.has(genus.id) ? (
                                      <ChevronDown className="w-4 h-4 text-earth-400 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-earth-400 flex-shrink-0" />
                                    )}
                                  </div>
                                </button>

                                {expandedGenera.has(genus.id) &&
                                  genusSpecies.map((species) => (
                                    <SpeciesCard
                                      key={species.id}
                                      species={species}
                                      observed={observedSpeciesIds.has(
                                        species.id
                                      )}
                                      inWishlist={wishlistSpeciesIds.has(
                                        species.id
                                      )}
                                      onToggleWishlist={(e) =>
                                        toggleWishlist(species.id, e)
                                      }
                                      compact
                                    />
                                  ))}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecommendedBirdCard({
  rec,
  observed,
  inWishlist,
  onToggleWishlist,
  onClick,
}: {
  rec: RecommendedBird;
  observed: boolean;
  inWishlist: boolean;
  onToggleWishlist: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const styles = REASON_TYPE_STYLES[rec.reasonType];
  const ReasonIcon = REASON_TYPE_ICONS[rec.reasonType];

  return (
    <div
      onClick={onClick}
      className={`card card-hover cursor-pointer bg-gradient-to-br ${styles.bg} p-4`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            observed ? "bg-olive-500" : "bg-white shadow-sm"
          }`}
        >
          {observed ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <Target className={`w-6 h-6 ${styles.iconColor}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4
                className={`font-semibold truncate ${
                  observed ? "text-olive-800" : "text-earth-800"
                }`}
              >
                {rec.species.name_cn}
              </h4>
              <p className="text-xs text-earth-400 truncate">
                {rec.species.name_latin}
              </p>
            </div>
            <button
              onClick={onToggleWishlist}
              className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                inWishlist
                  ? "bg-amber-400 text-white"
                  : "bg-white/60 text-earth-400 hover:bg-white hover:text-amber-500"
              }`}
            >
              <Star
                className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`}
              />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={`chip text-[10px] !py-0.5 !px-2 ${styles.chip}`}>
              <ReasonIcon className="w-3 h-3" />
              {rec.reason}
            </span>
            {rec.species.is_common && (
              <span className="chip-cream text-[10px] !py-0.5 !px-2">常见</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpeciesCard({
  species,
  observed,
  inWishlist,
  onToggleWishlist,
  compact = false,
}: {
  species: BirdSpecies;
  observed: boolean;
  inWishlist: boolean;
  onToggleWishlist: (e: React.MouseEvent) => void;
  compact?: boolean;
}) {
  return (
    <Link
      to={`/species/${species.id}`}
      className={`block border-t border-cream-50 ${
        compact ? "pl-20" : "p-3"
      } ${observed ? "bg-olive-50/50" : ""} hover:bg-cream-100 transition-colors`}
    >
      <div className="flex items-center gap-3 py-2">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            observed ? "bg-olive-500" : "bg-cream-200"
          }`}
        >
          {observed ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <Feather className="w-5 h-5 text-earth-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`font-medium truncate ${
                observed ? "text-olive-800" : "text-earth-700"
              }`}
            >
              {species.name_cn}
            </h4>
            {species.is_common && (
              <span className="chip-cream text-[10px] !py-0 !px-1.5 flex-shrink-0">
                常见
              </span>
            )}
            {inWishlist && (
              <Star className="w-3.5 h-3.5 text-amber-500 fill-current flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-earth-400 truncate">{species.name_latin}</p>
          {!compact && (
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <span className="chip-olive text-[10px]">
                {HabitatTypeLabels[species.habitat_type]}
              </span>
              <span className="chip-cream text-[10px]">
                {ResidenceTypeLabels[species.residence_type]}
              </span>
              <span className="chip-cream text-[10px]">
                {ConservationStatusLabels[species.conservation_status]}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleWishlist}
          className={`p-2 rounded-lg transition-all flex-shrink-0 ${
            inWishlist
              ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
              : "text-earth-300 hover:text-amber-500 hover:bg-cream-200/50"
          }`}
        >
          <Star className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} />
        </button>
        <ChevronRight className="w-4 h-4 text-earth-300 flex-shrink-0" />
      </div>
    </Link>
  );
}
