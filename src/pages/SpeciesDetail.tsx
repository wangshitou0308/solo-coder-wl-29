import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { LoadingSpinner, EmptyState } from "@/components/Common";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
  ConservationStatusLabels,
} from "@/types";
import type { BirdSpecies, UserSpeciesRecord, BirdObservation } from "@/types";
import { getObservationsBySpecies, getSpeciesById, getGenusById, getFamilyById, getOrderById } from "@/utils/db";
import { formatDate } from "@/utils/date";

export default function SpeciesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { init, userSpeciesRecords, allSpecies } = useAppStore();

  const [species, setSpecies] = useState<BirdSpecies | null>(null);
  const [userRecord, setUserRecord] = useState<UserSpeciesRecord | null>(null);
  const [observations, setObservations] = useState<BirdObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [genusName, setGenusName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [orderName, setOrderName] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (id) {
      loadData();
      checkWishlist();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);

    const sp = await getSpeciesById(id);
    setSpecies(sp || null);

    if (sp) {
      const genus = await getGenusById(sp.genus_id);
      setGenusName(genus?.name_cn || "");
      if (genus) {
        const family = await getFamilyById(genus.family_id);
        setFamilyName(family?.name_cn || "");
        if (family) {
          const order = await getOrderById(family.order_id);
          setOrderName(order?.name_cn || "");
        }
      }
    }

    const record = userSpeciesRecords.find((r) => r.species_id === id);
    setUserRecord(record || null);

    const obs = await getObservationsBySpecies(id);
    setObservations(obs);

    setLoading(false);
  };

  const checkWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem("birding_wishlist") || "[]");
    setIsWishlisted(wishlist.includes(id));
  };

  const toggleWishlist = () => {
    if (!id) return;
    const wishlist: string[] = JSON.parse(localStorage.getItem("birding_wishlist") || "[]");
    if (isWishlisted) {
      const newList = wishlist.filter((sid) => sid !== id);
      localStorage.setItem("birding_wishlist", JSON.stringify(newList));
    } else {
      wishlist.push(id);
      localStorage.setItem("birding_wishlist", JSON.stringify(wishlist));
    }
    setIsWishlisted(!isWishlisted);
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
          <p className="text-sm text-earth-500">
            {orderName} / {familyName} / {genusName}
          </p>
        </div>
        <button
          onClick={toggleWishlist}
          className={`btn-ghost !p-2 !min-h-0 ${isWishlisted ? "text-amber-500" : "text-earth-400"}`}
        >
          <Star className={`w-5 h-5 ${isWishlisted ? "fill-amber-500" : ""}`} />
        </button>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isObserved ? "bg-gradient-to-br from-olive-400 to-olive-600" : "bg-cream-200"
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
              {species.is_common && (
                <span className="chip-olive">常见</span>
              )}
              {isObserved && (
                <span className="chip-olive">已观察</span>
              )}
            </div>
            <p className="text-earth-500 italic mt-1">{species.name_latin}</p>
            {species.common_name && (
              <p className="text-sm text-earth-400 mt-1">又名：{species.common_name}</p>
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

      {isObserved && userRecord ? (
        <div className="card p-5 mb-6">
          <h2 className="section-title mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            我的观察记录
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-olive-50 rounded-xl">
              <p className="text-xs text-earth-500 mb-1">首次观察</p>
              <p className="font-medium text-earth-800 text-sm">
                {formatDate(userRecord.first_observed_at)}
              </p>
              <p className="text-xs text-earth-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {userRecord.first_location}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <p className="text-xs text-earth-500 mb-1">观察次数</p>
              <p className="font-semibold text-2xl text-earth-800">
                {userRecord.total_observations}
              </p>
              <p className="text-xs text-earth-500">次</p>
            </div>
          </div>

          {observations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-earth-700 mb-3">观察历史</h3>
              <div className="space-y-2">
                {observations.slice(0, 10).map((obs) => (
                  <Link
                    key={obs.id}
                    to={`/journal/${obs.journal_id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-earth-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-earth-700 truncate">
                        {formatDate(obs.created_at)}
                      </p>
                      <p className="text-xs text-earth-400">
                        {obs.count} 只 · {obs.behavior || "未记录行为"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-earth-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
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
          <button onClick={toggleWishlist} className="btn-secondary flex-1">
            <Star className={`w-4 h-4 ${isWishlisted ? "fill-amber-500 text-amber-500" : ""}`} />
            {isWishlisted ? "已收藏" : "加入愿望清单"}
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
