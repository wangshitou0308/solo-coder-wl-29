import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  Feather,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  Star,
  Filter,
} from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/Common";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
  ConservationStatusLabels,
} from "@/types";
import type { BirdOrder, BirdFamily, BirdGenus, BirdSpecies, HabitatType, ResidenceType } from "@/types";

type ViewMode = "order" | "family" | "genus" | "species";

export default function SpeciesGuide() {
  const { init, loading, orders, allSpecies, userSpeciesRecords, getFamilies, getGenera, getSpeciesByGenus } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterHabitat, setFilterHabitat] = useState<HabitatType | "all">("all");
  const [filterResidence, setFilterResidence] = useState<ResidenceType | "all">("all");
  const [showOnlyObserved, setShowOnlyObserved] = useState(false);

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [expandedGenera, setExpandedGenera] = useState<Set<string>>(new Set());
  const [familiesByOrder, setFamiliesByOrder] = useState<Map<string, BirdFamily[]>>(new Map());
  const [generaByFamily, setGeneraByFamily] = useState<Map<string, BirdGenus[]>>(new Map());
  const [speciesByGenus, setSpeciesByGenus] = useState<Map<string, BirdSpecies[]>>(new Map());

  const observedSpeciesIds = new Set(userSpeciesRecords.map((r) => r.species_id));

  useEffect(() => {
    init();
  }, [init]);

  const toggleOrder = async (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      if (!familiesByOrder.has(orderId)) {
        const families = await getFamilies(orderId);
        setFamiliesByOrder(new Map(familiesByOrder.set(orderId, families)));
      }
    }
    setExpandedOrders(newExpanded);
  };

  const toggleFamily = async (familyId: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId);
    } else {
      newExpanded.add(familyId);
      if (!generaByFamily.has(familyId)) {
        const genera = await getGenera(familyId);
        setGeneraByFamily(new Map(generaByFamily.set(familyId, genera)));
      }
    }
    setExpandedFamilies(newExpanded);
  };

  const toggleGenus = async (genusId: string) => {
    const newExpanded = new Set(expandedGenera);
    if (newExpanded.has(genusId)) {
      newExpanded.delete(genusId);
    } else {
      newExpanded.add(genusId);
      if (!speciesByGenus.has(genusId)) {
        const species = await getSpeciesByGenus(genusId);
        setSpeciesByGenus(new Map(speciesByGenus.set(genusId, species)));
      }
    }
    setExpandedGenera(newExpanded);
  };

  const filteredSpecies = allSpecies.filter((s) => {
    const matchSearch =
      !searchQuery ||
      s.name_cn.includes(searchQuery) ||
      s.name_latin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.common_name && s.common_name.includes(searchQuery));
    const matchHabitat = filterHabitat === "all" || s.habitat_type === filterHabitat;
    const matchResidence = filterResidence === "all" || s.residence_type === filterResidence;
    const matchObserved = !showOnlyObserved || observedSpeciesIds.has(s.id);
    return matchSearch && matchHabitat && matchResidence && matchObserved;
  });

  const isSearchMode = searchQuery || filterHabitat !== "all" || filterResidence !== "all" || showOnlyObserved;

  const getObservedCountForOrder = (orderId: string) => {
    return userSpeciesRecords.filter((r) => {
      const sp = allSpecies.find((s) => s.id === r.species_id);
      if (!sp) return false;
      const genusId = sp.genus_id;
      const genus = Array.from(generaByFamily.values()).flat().find((g) => g.id === genusId);
      if (!genus) return false;
      const family = Array.from(familiesByOrder.values()).flat().find((f) => f.id === genus.family_id);
      return family?.order_id === orderId;
    }).length;
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
            onChange={(e) => setFilterResidence(e.target.value as ResidenceType | "all")}
            className="input !py-2 !min-h-0 text-sm flex-1 min-w-[120px]"
          >
            <option value="all">全部居留型</option>
            {Object.entries(ResidenceTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowOnlyObserved(!showOnlyObserved)}
            className={`btn-secondary !py-2 !min-h-0 text-sm ${showOnlyObserved ? "!bg-olive-100 !text-olive-800 !border-olive-300" : ""}`}
          >
            <Check className={`w-4 h-4 ${showOnlyObserved ? "" : "opacity-0"}`} />
            仅显示已观察
          </button>
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
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-earth-500">
                    {familiesByOrder.get(order.id)?.length || 0} 科
                  </span>
                  {expandedOrders.has(order.id) ? (
                    <ChevronDown className="w-5 h-5 text-earth-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-earth-400" />
                  )}
                </div>
              </button>

              {expandedOrders.has(order.id) &&
                familiesByOrder.get(order.id)?.map((family) => (
                  <div key={family.id} className="border-t border-cream-100">
                    <button
                      onClick={() => toggleFamily(family.id)}
                      className="w-full p-3 pl-12 flex items-center gap-3 text-left hover:bg-cream-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-earth-700 text-sm">{family.name_cn}</h4>
                        <p className="text-xs text-earth-400">{family.name_latin}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-earth-400">
                          {generaByFamily.get(family.id)?.length || 0} 属
                        </span>
                        {expandedFamilies.has(family.id) ? (
                          <ChevronDown className="w-4 h-4 text-earth-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-earth-400" />
                        )}
                      </div>
                    </button>

                    {expandedFamilies.has(family.id) &&
                      generaByFamily.get(family.id)?.map((genus) => (
                        <div key={genus.id} className="border-t border-cream-50">
                          <button
                            onClick={() => toggleGenus(genus.id)}
                            className="w-full p-2.5 pl-16 flex items-center gap-2 text-left hover:bg-cream-50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-earth-700 text-sm">{genus.name_cn}</h5>
                              <p className="text-xs text-earth-400">{genus.name_latin}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-earth-400">
                                {speciesByGenus.get(genus.id)?.length || 0} 种
                              </span>
                              {expandedGenera.has(genus.id) ? (
                                <ChevronDown className="w-4 h-4 text-earth-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-earth-400" />
                              )}
                            </div>
                          </button>

                          {expandedGenera.has(genus.id) &&
                            speciesByGenus.get(genus.id)?.map((species) => (
                              <SpeciesCard
                                key={species.id}
                                species={species}
                                observed={observedSpeciesIds.has(species.id)}
                                compact
                              />
                            ))}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpeciesCard({
  species,
  observed,
  compact = false,
}: {
  species: BirdSpecies;
  observed: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      to={`/species/${species.id}`}
      className={`block border-t border-cream-50 ${compact ? "pl-20" : "p-3"} ${observed ? "bg-olive-50/50" : ""} hover:bg-cream-100 transition-colors`}
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
            <h4 className={`font-medium ${observed ? "text-olive-800" : "text-earth-700"}`}>
              {species.name_cn}
            </h4>
            {species.is_common && (
              <span className="chip-cream text-[10px] !py-0 !px-1.5">常见</span>
            )}
          </div>
          <p className="text-xs text-earth-400 truncate">{species.name_latin}</p>
          {!compact && (
            <div className="flex gap-1.5 mt-1.5">
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
        <ChevronRight className="w-4 h-4 text-earth-300 flex-shrink-0" />
      </div>
    </Link>
  );
}
