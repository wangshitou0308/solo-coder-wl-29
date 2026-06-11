import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  Star,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Check,
} from "lucide-react";
import { LoadingSpinner, EmptyState, PageHeader } from "@/components/Common";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
} from "@/types";
import type { BirdSpecies } from "@/types";

export default function Wishlist() {
  const { init, loading, allSpecies, userSpeciesRecords } = useAppStore();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    const stored = localStorage.getItem("birding_wishlist");
    if (stored) {
      setWishlist(JSON.parse(stored));
    }
  };

  const removeFromWishlist = (speciesId: string) => {
    const newList = wishlist.filter((id) => id !== speciesId);
    setWishlist(newList);
    localStorage.setItem("birding_wishlist", JSON.stringify(newList));
  };

  const getSpeciesById = (id: string): BirdSpecies | undefined => {
    return allSpecies.find((s) => s.id === id);
  };

  const observedSpeciesIds = new Set(userSpeciesRecords.map((r) => r.species_id));

  const wishlistSpecies = wishlist
    .map((id) => getSpeciesById(id))
    .filter((s): s is BirdSpecies => s !== undefined);

  const filteredSpecies = wishlistSpecies.filter((s) => {
    if (!searchQuery) return true;
    return (
      s.name_cn.includes(searchQuery) ||
      s.name_latin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.common_name && s.common_name.includes(searchQuery))
    );
  });

  const unobservedWishlist = wishlistSpecies.filter(
    (s) => !observedSpeciesIds.has(s.id)
  );
  const observedWishlist = wishlistSpecies.filter((s) =>
    observedSpeciesIds.has(s.id)
  );

  const displayUnobserved = searchQuery
    ? filteredSpecies.filter((s) => !observedSpeciesIds.has(s.id))
    : unobservedWishlist;
  const displayObserved = searchQuery
    ? filteredSpecies.filter((s) => observedSpeciesIds.has(s.id))
    : observedWishlist;

  if (loading && !allSpecies.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-slide-up pb-24">
      <PageHeader
        title="愿望清单"
        subtitle={`${unobservedWishlist.length} 种待观察 / ${wishlistSpecies.length} 种总数`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
          <Star className="w-7 h-7 text-white fill-white" />
        </div>
      </PageHeader>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
        <input
          type="text"
          placeholder="搜索愿望清单中的鸟种..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-12"
        />
      </div>

      {wishlistSpecies.length === 0 ? (
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
      ) : (
        <div className="space-y-6">
          {displayUnobserved.length > 0 && (
            <div>
              <h2 className="section-title text-lg">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                待观察 ({displayUnobserved.length} 种)
              </h2>
              <div className="space-y-2">
                {displayUnobserved.map((species) => (
                  <WishlistCard
                    key={species.id}
                    species={species}
                    observed={false}
                    onRemove={() => removeFromWishlist(species.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {displayObserved.length > 0 && (
            <div>
              <h2 className="section-title text-lg">
                <Check className="w-5 h-5 text-olive-600" />
                已完成 ({displayObserved.length} 种)
              </h2>
              <div className="space-y-2">
                {displayObserved.map((species) => (
                  <WishlistCard
                    key={species.id}
                    species={species}
                    observed={true}
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
  species,
  observed,
  onRemove,
}: {
  species: BirdSpecies;
  observed: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="card p-4 flex items-center gap-3 group">
      <Link
        to={`/species/${species.id}`}
        className="flex-1 min-w-0 flex items-center gap-3"
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            observed ? "bg-olive-500" : "bg-amber-100"
          }`}
        >
          {observed ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <Star className="w-6 h-6 text-amber-600 fill-amber-400" />
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
              <span className="chip-cream text-[10px] !py-0 !px-1.5">常见</span>
            )}
          </div>
          <p className="text-xs text-earth-400 truncate">{species.name_latin}</p>
          <div className="flex gap-1.5 mt-1">
            <span className="chip-olive text-[10px]">
              {HabitatTypeLabels[species.habitat_type]}
            </span>
            <span className="chip-cream text-[10px]">
              {ResidenceTypeLabels[species.residence_type]}
            </span>
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
