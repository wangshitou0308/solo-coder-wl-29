import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import {
  Feather,
  BookOpen,
  BarChart3,
  CalendarPlus,
  Users,
  Clock,
  Plus,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { LoadingSpinner, EmptyState, StatCard } from "@/components/Common";
import { formatDate, formatDuration, getCurrentMonth } from "@/utils/date";
import {
  HabitatTypeLabels,
} from "@/types";

export default function Home() {
  const { init, loading, journals, userSpeciesRecords, allSpecies, orders } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  const totalSpecies = userSpeciesRecords.length;
  const totalJournals = journals.length;

  const observedSpeciesIds = new Set(userSpeciesRecords.map((r) => r.species_id));
  const familyIds = new Set<string>();
  const genusIds = new Set<string>();

  const currentMonth = getCurrentMonth();
  let monthNew = 0;
  let totalMinutes = 0;

  for (const j of journals) {
    const dur = (new Date(j.end_time).getTime() - new Date(j.start_time).getTime()) / 60000;
    if (dur > 0) totalMinutes += dur;
  }

  for (const r of userSpeciesRecords) {
    if (r.first_observed_at.startsWith(currentMonth)) {
      monthNew++;
    }
    const sp = allSpecies.find((s) => s.id === r.species_id);
    if (sp) {
      genusIds.add(sp.genus_id);
    }
  }

  if (loading && !journals.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-earth-800 mb-2">
          欢迎回来 <span className="text-olive-700">观鸟人</span>
        </h1>
        <p className="text-earth-500">记录每一次与自然的相遇</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Feather} value={totalSpecies} label="已观察鸟种" color="olive" />
        <StatCard icon={BookOpen} value={totalJournals} label="观鸟日记" color="earth" />
        <StatCard icon={CalendarPlus} value={monthNew} label="本月新种" color="amber" />
        <StatCard icon={Clock} value={`${Math.floor(totalMinutes / 60)}h`} label="累计时长" color="cream" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link
          to="/journal/new"
          className="card card-hover p-5 block group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-olive-400 to-olive-600 flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
            <Plus className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-800 mb-1">
            新建日记
          </h3>
          <p className="text-sm text-earth-500">记录今天的观鸟发现</p>
        </Link>
        <Link
          to="/species"
          className="card card-hover p-5 block group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-earth-400 to-earth-600 flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
            <Feather className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-800 mb-1">
            浏览图鉴
          </h3>
          <p className="text-sm text-earth-500">
            {observedSpeciesIds.size}/{allSpecies.length} 种已点亮
          </p>
        </Link>
        <Link
          to="/statistics"
          className="card card-hover p-5 block group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-800 mb-1">
            数据分析
          </h3>
          <p className="text-sm text-earth-500">查看你的观鸟统计</p>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            <Leaf className="w-5 h-5 text-olive-600" />
            最近记录
          </h2>
          <Link
            to="/journal"
            className="text-sm text-olive-700 hover:text-olive-800 font-medium flex items-center gap-0.5"
          >
            全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {journals.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="还没有观鸟日记"
            description="开始记录你的第一次观鸟吧"
            action={
              <Link to="/journal/new" className="btn-primary">
                <Plus className="w-4 h-4" /> 新建日记
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {journals.slice(0, 5).map((journal) => {
              return (
                <Link
                  key={journal.id}
                  to={`/journal/${journal.id}`}
                  className="card card-hover p-4 flex gap-4 items-start"
                >
                  <div className="flex-shrink-0 text-center w-14">
                    <div className="text-2xl font-serif font-bold text-olive-700">
                      {new Date(journal.start_time).getDate()}
                    </div>
                    <div className="text-xs text-earth-500">
                      {new Date(journal.start_time).getMonth() + 1}月
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-earth-800 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{journal.location || "未命名地点"}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-earth-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(journal.start_time, journal.end_time)}
                      </span>
                      <span className="chip-olive">
                        {HabitatTypeLabels[journal.habitat_type] || journal.habitat_type}
                      </span>
                      {journal.companions && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {journal.companions.split(",").length}人
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-earth-400 mt-1">
                      {formatDate(journal.start_time)}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-earth-300 flex-shrink-0 mt-2" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
