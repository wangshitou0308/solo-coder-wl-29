import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { LoadingSpinner, EmptyState, PageHeader } from "@/components/Common";
import { formatDate, formatDuration } from "@/utils/date";
import { HabitatTypeLabels } from "@/types";
import type { HabitatType } from "@/types";

export default function JournalList() {
  const { init, loading, journals, allSpecies, userSpeciesRecords } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHabitat, setFilterHabitat] = useState<HabitatType | "all">("all");

  useEffect(() => {
    init();
  }, [init]);

  const filteredJournals = journals.filter((j) => {
    const matchSearch =
      !searchQuery ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHabitat = filterHabitat === "all" || j.habitat_type === filterHabitat;
    return matchSearch && matchHabitat;
  });

  const getJournalSpeciesCount = (journalId: string) => {
    const speciesSet = new Set<string>();
    userSpeciesRecords.forEach((r) => {
      if (r.species_id) speciesSet.add(r.species_id);
    });
    return speciesSet.size;
  };

  if (loading && !journals.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="观鸟日记"
        subtitle="记录每一次与自然的相遇"
      >
        <Link to="/journal/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          新建日记
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
          <input
            type="text"
            placeholder="搜索地点、笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-earth-400" />
          <select
            value={filterHabitat}
            onChange={(e) => setFilterHabitat(e.target.value as HabitatType | "all")}
            className="input pl-12 pr-10 appearance-none cursor-pointer"
          >
            <option value="all">全部栖息地</option>
            {Object.entries(HabitatTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredJournals.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="还没有观鸟日记"
          description={searchQuery || filterHabitat !== "all" ? "没有找到匹配的日记" : "开始记录你的第一次观鸟吧"}
          action={
            <Link to="/journal/new" className="btn-primary">
              <Plus className="w-4 h-4" /> 新建日记
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredJournals.map((journal) => {
            const speciesCount = getJournalSpeciesCount(journal.id);
            return (
              <Link
                key={journal.id}
                to={`/journal/${journal.id}`}
                className="card card-hover p-4 flex gap-4 items-start group"
              >
                <div className="flex-shrink-0 text-center w-14 bg-cream-50 rounded-xl py-2">
                  <div className="text-2xl font-serif font-bold text-olive-700">
                    {new Date(journal.start_time).getDate()}
                  </div>
                  <div className="text-xs text-earth-500">
                    {new Date(journal.start_time).getMonth() + 1}月
                  </div>
                  <div className="text-[10px] text-earth-400 mt-0.5">
                    {new Date(journal.start_time).getFullYear()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-earth-800 flex items-center gap-2 flex-wrap">
                    <span className="truncate">{journal.location || "未命名地点"}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-earth-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(journal.start_time, journal.end_time)}
                    </span>
                    <span className="chip-olive">
                      {HabitatTypeLabels[journal.habitat_type] || journal.habitat_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(journal.start_time)}
                    </span>
                    {journal.companions && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {journal.companions.split(",").length}人同行
                      </span>
                    )}
                  </div>
                  {journal.notes && (
                    <p className="text-sm text-earth-500 mt-2 line-clamp-2">
                      {journal.notes}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-earth-300 flex-shrink-0 mt-4 group-hover:text-olive-600 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
