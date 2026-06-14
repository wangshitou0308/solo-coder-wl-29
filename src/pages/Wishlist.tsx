import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  Star,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Check,
  Clock,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { LoadingSpinner, EmptyState, PageHeader, StatCard } from "@/components/Common";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
} from "@/types";
import type { BirdSpecies, HabitatType, ResidenceType, WishlistItem } from "@/types";
import { formatDate } from "@/utils/date";

type CommonFilter = "all" | "common" | "uncommon";

interface WishlistEntry {
  item: WishlistItem;
  species: BirdSpecies;
}

export default function Wishlist() {
  const {
    init,
    loading,
    allSpecies,
    wishlist,
    refreshWishlist,
    removeFromWishlist,
    getWishlistItem,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterHabitat, setFilterHabitat] = useState<HabitatType | "all">("all");
  const [filterResidence, setFilterResidence] = useState<ResidenceType | "all">("all");
  const [filterCommon, setFilterCommon] = useState<CommonFilter>("all");

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const wishlistEntries = useMemo<WishlistEntry[]>(() => {
    return wishlist
      .map((item) => {
        const species = allSpecies.find((s) => s.id === item.species_id);
        return species ? { item, species } : null;
      })
      .filter((e): e is WishlistEntry => e !== null);
  }, [wishlist, allSpecies]);

  const totalCount = wishlistEntries.length;
  const pendingCount = wishlistEntries.filter((e) => !e.item.completed_at).length;
  const completedCount = totalCount - pendingCount;

  const filteredEntries = wishlistEntries.filter(({ species, item }) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        species.name_cn.includes(searchQuery) ||
        species.name_latin.toLowerCase().includes(q) ||
        (species.common_name && species.common_name.includes(searchQuery));
      if (!matchSearch) return false;
    }

    if (filterHabitat !== "all" && species.habitat_type !== filterHabitat) {
      return false;
    }

    if (filterResidence !== "all" && species.residence_type !== filterResidence) {
      return false;
    }

    if (filterCommon === "common" && !species.is_common) {
      return false;
    }
    if (filterCommon === "uncommon" && species.is_common) {
      return false;
    }

    return true;
  });

  const pendingEntries = filteredEntries.filter((e) => !e.item.completed_at);
  const completedEntries = filteredEntries.filter((e) => e.item.completed_at);

  const hasActiveFilters =
    searchQuery !== "" ||
    filterHabitat !== "all" ||
    filterResidence !== "all" ||
    filterCommon !== "all";

  if (loading && !allSpecies.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-slide-up pb-24">
      <PageHeader
        title="愿望清单"
        subtitle={`${pendingCount} 种待观察 / ${totalCount} 种总数`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
          <Star className="w-7 h-7 text-white fill-white" />
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={Sparkles}
          value={totalCount}
          label="总数"
          color="earth"
        />
        <StatCard
          icon={Clock}
          value={pendingCount}
          label="待观察"
          color="amber"
        />
        <StatCard
          icon={Check}
          value={completedCount}
          label="已完成"
          color="olive"
        />
      </div>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
          <input
            type="text"
            placeholder="搜索愿望清单中的鸟种..."
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

          <select
            value={filterCommon}
            onChange={(e) => setFilterCommon(e.target.value as CommonFilter)}
            className="input !py-2 !min-h-0 text-sm flex-1 min-w-[120px]"
          >
            <option value="all">全部常见度</option>
            <option value="common">常见</option>
            <option value="uncommon">罕见</option>
          </select>
        </div>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={Star}
          title="愿望清单是空的"
          description="浏览图鉴时点击星标将想要观察的鸟种加入愿望清单"
          action={
            <Link to="/species" className="btn-primary">
              <Plus className="w-4 h-4" /> 浏览图鉴
            </Link>
          }
        />
      ) : hasActiveFilters && filteredEntries.length === 0 ? (
        <EmptyState
          icon={Search}
          title="没有匹配的鸟种"
          description="尝试调整筛选条件或清空搜索"
        />
      ) : (
        <div className="space-y-6">
          {pendingEntries.length > 0 && (
            <div>
              <h2 className="section-title text-lg">
                <Clock className="w-5 h-5 text-amber-500" />
                待观察 ({pendingEntries.length} 种)
              </h2>
              <div className="space-y-2">
                {pendingEntries.map(({ item, species }) => (
                  <WishlistCard
                    key={species.id}
                    item={item}
                    species={species}
                    onRemove={() => removeFromWishlist(species.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {completedEntries.length > 0 && (
            <div>
              <h2 className="section-title text-lg">
                <Check className="w-5 h-5 text-olive-600" />
                已完成 ({completedEntries.length} 种)
              </h2>
              <div className="space-y-2">
                {completedEntries.map(({ item, species }) => (
                  <WishlistCard
                    key={species.id}
                    item={item}
                    species={species}
                    onRemove={() => removeFromWishlist(species.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-cream-100/95 backdrop-blur-md border-t border-cream-200 md:hidden">
        <div className="container">
          <Link to="/species" className="btn-primary w-full">
            <Plus className="w-4 h-4" />
            浏览图鉴添加
          </Link>
        </div>
      </div>
    </div>
  );
}

function WishlistCard({
  item,
  species,
  onRemove,
}: {
  item: WishlistItem;
  species: BirdSpecies;
  onRemove: () => void;
}) {
  const isCompleted = !!item.completed_at;

  return (
    <div className="card p-4 flex items-center gap-3 group">
      <Link
        to={`/species/${species.id}`}
        className="flex-1 min-w-0 flex items-center gap-3"
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCompleted ? "bg-olive-500" : "bg-amber-100"
          }`}
        >
          {isCompleted ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <Star className="w-6 h-6 text-amber-600 fill-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`font-medium truncate ${
                isCompleted ? "text-olive-800" : "text-earth-700"
              }`}
            >
              {species.name_cn}
            </h4>
            {species.is_common && (
              <span className="chip-cream text-[10px] !py-0 !px-1.5">常见</span>
            )}
          </div>
          <p className="text-xs text-earth-400 truncate">{species.name_latin}</p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            <span className="chip-olive text-[10px]">
              {HabitatTypeLabels[species.habitat_type]}
            </span>
            <span className="chip-cream text-[10px]">
              {ResidenceTypeLabels[species.residence_type]}
            </span>
          </div>
          <div className="flex gap-3 mt-1.5 text-[10px] text-earth-400">
            <span className="flex items-center gap-0.5">
              <CalendarDays className="w-3 h-3" />
              加入 {formatDate(item.added_at)}
            </span>
            {isCompleted && (
              <span className="flex items-center gap-0.5 text-olive-600">
                <Check className="w-3 h-3" />
                完成于 {formatDate(item.completed_at!)}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-earth-300 flex-shrink-0" />
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="p-2 text-earth-300 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
