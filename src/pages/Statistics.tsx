import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import {
  BarChart3,
  Feather,
  BookOpen,
  Clock,
  Calendar,
  TrendingUp,
  TreeDeciduous,
  Map,
  Bird,
  Award,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CalendarDays,
  Leaf,
  Snowflake,
  Flame,
  Flower2,
  Crown,
  Sparkles,
  Plus,
} from "lucide-react";
import { LoadingSpinner, PageHeader, StatCard, EmptyState } from "@/components/Common";
import {
  HabitatTypeLabels,
  ResidenceTypeLabels,
} from "@/types";
import type { HabitatType, ResidenceType } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { getCurrentYear } from "@/utils/date";
import {
  getCompleteStats,
  getTaxonomyStats,
  type CompleteStats,
} from "@/utils/stats";
import { formatDate } from "@/utils/date";

const HABITAT_COLORS: Record<HabitatType, string> = {
  forest: "#556B2F",
  wetland: "#4A90A4",
  grassland: "#8B9A46",
  urban: "#7D5A3C",
  mountain: "#6B8E6B",
  coastal: "#5B8DB8",
  farmland: "#C4A35A",
};

const RESIDENCE_COLORS: Record<ResidenceType, string> = {
  resident: "#556B2F",
  summer_visitor: "#C4A35A",
  winter_visitor: "#5B8DB8",
  passage_migrant: "#7D5A3C",
};

const SEASON_ICONS: Record<string, React.ElementType> = {
  spring: Flower2,
  summer: Flame,
  autumn: Leaf,
  winter: Snowflake,
};

const TIME_OF_DAY_ICONS: Record<string, React.ElementType> = {
  early_morning: Sunrise,
  morning: Sun,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

export default function Statistics() {
  const { init, loading, allSpecies, allFamilies, allGenera, userSpeciesRecords, journals, observations } = useAppStore();
  const [year, setYear] = useState(getCurrentYear());

  useEffect(() => {
    init();
  }, [init]);

  const stats: CompleteStats | null = useMemo(() => {
    if (!allSpecies.length || !allFamilies.length || !allGenera.length) return null;
    return getCompleteStats(
      allSpecies,
      allFamilies,
      allGenera,
      userSpeciesRecords,
      journals,
      observations,
      year
    );
  }, [allSpecies, allFamilies, allGenera, userSpeciesRecords, journals, observations, year]);

  const taxonomyStats = useMemo(() => {
    if (!allSpecies.length || !allFamilies.length || !allGenera.length) return null;
    return getTaxonomyStats(allSpecies, allFamilies, allGenera, userSpeciesRecords);
  }, [allSpecies, allFamilies, allGenera, userSpeciesRecords]);

  const observedSpecies = useMemo(
    () => userSpeciesRecords
      .map((r) => allSpecies.find((s) => s.id === r.species_id))
      .filter((s): s is NonNullable<typeof s> => !!s),
    [userSpeciesRecords, allSpecies]
  );

  const habitatData = useMemo(() => {
    const habitatCount: Record<string, number> = {};
    for (const sp of observedSpecies) {
      const key = sp.habitat_type;
      habitatCount[key] = (habitatCount[key] || 0) + 1;
    }
    return Object.entries(habitatCount).map(([key, value]) => ({
      name: HabitatTypeLabels[key as HabitatType] || key,
      value,
      color: HABITAT_COLORS[key as HabitatType] || "#999",
    }));
  }, [observedSpecies]);

  const residenceData = useMemo(() => {
    const residenceCount: Record<string, number> = {};
    for (const sp of observedSpecies) {
      const key = sp.residence_type;
      residenceCount[key] = (residenceCount[key] || 0) + 1;
    }
    return Object.entries(residenceCount).map(([key, value]) => ({
      name: ResidenceTypeLabels[key as ResidenceType] || key,
      value,
      color: RESIDENCE_COLORS[key as ResidenceType] || "#999",
    }));
  }, [observedSpecies]);

  if (loading && !allSpecies.length) {
    return <LoadingSpinner />;
  }

  const years = Array.from(
    new Set(journals.map((j) => new Date(j.start_time).getFullYear()))
  ).sort((a, b) => b - a);
  if (!years.includes(getCurrentYear())) {
    years.unshift(getCurrentYear());
  }

  const hasData = journals.length > 0 && observations.length > 0;

  if (!hasData) {
    return (
      <div className="animate-slide-up">
        <PageHeader title="观鸟统计" subtitle="追踪你的观鸟旅程" />
        <EmptyState
          icon={BarChart3}
          title="还没有统计数据"
          description="开始记录你的第一条观鸟日记，统计数据将自动生成"
          action={
            <Link to="/journal/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              记录第一条观鸟日记
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-slide-up pb-8">
      <PageHeader title="观鸟统计" subtitle="追踪你的观鸟旅程">
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="input !py-2 !min-h-0 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
      </PageHeader>

      {stats && taxonomyStats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={Feather}
              value={taxonomyStats.speciesCount}
              label="累计鸟种"
              color="olive"
            />
            <StatCard
              icon={BookOpen}
              value={stats.totalJournals}
              label="观鸟日记"
              color="earth"
            />
            <StatCard
              icon={TreeDeciduous}
              value={taxonomyStats.familyCount}
              label="覆盖科数"
              color="amber"
            />
            <StatCard
              icon={Clock}
              value={`${Math.floor(stats.totalMinutes / 60)}h`}
              label="累计时长"
              color="cream"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="card p-5">
              <h3 className="section-title text-lg mb-4">
                <Calendar className="w-5 h-5 text-olive-600" />
                {year}年 月度观察次数
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE5DD" />
                    <XAxis dataKey="month" tick={{ fill: "#7D5A3C", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#7D5A3C", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAF8F5",
                        border: "1px solid #EDE4D0",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="观察次数" fill="#8B9A46" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title text-lg mb-4">
                <TrendingUp className="w-5 h-5 text-olive-600" />
                {year}年 Life List 新增趋势
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE5DD" />
                    <XAxis dataKey="month" tick={{ fill: "#7D5A3C", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#7D5A3C", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAF8F5",
                        border: "1px solid #EDE4D0",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="lifeListNew"
                      name="Life List新增"
                      stroke="#8B9A46"
                      strokeWidth={2}
                      dot={{ fill: "#8B9A46" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="新鸟种"
                      name="当月新鸟种"
                      stroke="#C4A35A"
                      strokeWidth={2}
                      dot={{ fill: "#C4A35A" }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {stats.location.length > 0 && (
            <div className="card p-5 mb-6">
              <h3 className="section-title text-lg mb-4">
                <Map className="w-5 h-5 text-olive-600" />
                常去地点排行
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.location.slice(0, 6).map((loc, index) => (
                  <div
                    key={loc.location}
                    className="p-4 bg-cream-50 rounded-xl flex items-start gap-3"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      index === 0 ? "bg-amber-400" :
                      index === 1 ? "bg-earth-400" :
                      index === 2 ? "bg-amber-600" :
                      "bg-cream-300"
                    }`}>
                      <Crown className={`w-5 h-5 ${
                        index < 3 ? "text-white" : "text-earth-500"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-earth-800 text-sm truncate">
                        {loc.location}
                      </h4>
                      <div className="flex gap-3 mt-1 text-xs text-earth-500">
                        <span>{loc.journalCount} 次出行</span>
                        <span>·</span>
                        <span>{loc.speciesCount} 种鸟</span>
                        <span>·</span>
                        <span>{loc.observationCount} 条记录</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="card p-5">
              <h3 className="section-title text-lg mb-4">
                <Sunrise className="w-5 h-5 text-olive-600" />
                观鸟时段分布
              </h3>
              <div className="space-y-3">
                {stats.timeOfDay.map((tod) => {
                  const Icon = TIME_OF_DAY_ICONS[tod.period] || Clock;
                  const maxCount = Math.max(...stats.timeOfDay.map((t) => t.count));
                  const percentage = maxCount > 0 ? (tod.count / maxCount) * 100 : 0;
                  return (
                    <div key={tod.period} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-earth-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-earth-700">{tod.label}</span>
                          <span className="text-sm font-medium text-earth-800">{tod.count} 次</span>
                        </div>
                        <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-olive-400 to-olive-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title text-lg mb-4">
                <CalendarDays className="w-5 h-5 text-olive-600" />
                星期分布
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weekday}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE5DD" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#7D5A3C", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "#7D5A3C", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAF8F5",
                        border: "1px solid #EDE4D0",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="count" name="观鸟次数" fill="#5B8DB8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card p-5 mb-6">
            <h3 className="section-title text-lg mb-4">
              <Leaf className="w-5 h-5 text-olive-600" />
              季节分布
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.season.map((s) => {
                const Icon = SEASON_ICONS[s.season] || Leaf;
                return (
                  <div
                    key={s.season}
                    className="p-4 rounded-xl text-center bg-gradient-to-br from-cream-50 to-cream-100"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                      <Icon className="w-6 h-6 text-olive-600" />
                    </div>
                    <h4 className="font-medium text-earth-800">{s.label}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-2xl font-serif font-bold text-olive-600">
                        {s.count}
                      </p>
                      <p className="text-xs text-earth-500">次出行</p>
                      <p className="text-sm font-medium text-earth-700">
                        {s.speciesCount} 种鸟
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="card p-5">
              <h3 className="section-title text-lg mb-4">
                <Crown className="w-5 h-5 text-amber-500" />
                最常见鸟 Top 10
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {stats.topSpecies.map((ts, index) => (
                  <div
                    key={ts.species.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      index === 0 ? "bg-amber-400 text-white" :
                      index === 1 ? "bg-earth-400 text-white" :
                      index === 2 ? "bg-amber-600 text-white" :
                      "bg-cream-200 text-earth-600"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-earth-800 text-sm truncate">
                        {ts.species.name_cn}
                      </p>
                      <p className="text-xs text-earth-400 truncate">
                        {ts.species.name_latin}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-earth-800 text-sm">
                        {ts.observationCount} 次
                      </p>
                      <p className="text-xs text-earth-400">
                        共 {ts.totalCount} 只
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title text-lg mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                最常观察科属
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-earth-600 mb-2">科 Top 5</h4>
                  <div className="space-y-2">
                    {stats.topFamilies.map((tf, index) => (
                      <div
                        key={tf.family.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-cream-50"
                      >
                        <span className="text-xs font-bold text-olive-600 w-5">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-earth-800 text-sm truncate">
                            {tf.family.name_cn}
                          </p>
                          <p className="text-xs text-earth-400 truncate">
                            {tf.family.name_latin}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <span className="text-olive-600 font-medium">{tf.speciesCount} 种</span>
                          <span className="text-earth-400 ml-1">{tf.observationCount} 次</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-earth-600 mb-2">属 Top 5</h4>
                  <div className="space-y-2">
                    {stats.topGenera.map((tg, index) => (
                      <div
                        key={tg.genus.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-amber-50"
                      >
                        <span className="text-xs font-bold text-amber-600 w-5">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-earth-800 text-sm truncate">
                            {tg.genus.name_cn}
                          </p>
                          <p className="text-xs text-earth-400 truncate">
                            {tg.genus.name_latin}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <span className="text-amber-600 font-medium">{tg.speciesCount} 种</span>
                          <span className="text-earth-400 ml-1">{tg.observationCount} 次</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {stats.rareRecords.length > 0 && (
            <div className="card p-5 mb-6">
              <h3 className="section-title text-lg mb-4">
                <Award className="w-5 h-5 text-purple-500" />
                稀有记录 (观察次数最少)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {stats.rareRecords.map((rr) => (
                  <Link
                    key={rr.species.id}
                    to={`/species/${rr.species.id}`}
                    className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors text-center"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                      <Bird className="w-6 h-6 text-purple-500" />
                    </div>
                    <h4 className="font-medium text-earth-800 text-sm truncate">
                      {rr.species.name_cn}
                    </h4>
                    <p className="text-xs text-earth-400 truncate">
                      {rr.species.name_latin}
                    </p>
                    <p className="mt-1 text-xs text-purple-600 font-medium">
                      仅 {rr.observationCount} 次记录
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="card p-5">
              <h3 className="section-title text-lg mb-4">
                <Map className="w-5 h-5 text-olive-600" />
                栖息地类型分布
              </h3>
              <div className="h-64 flex items-center justify-center">
                {habitatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={habitatData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {habitatData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-earth-400 text-sm">暂无数据</p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title text-lg mb-4">
                <Bird className="w-5 h-5 text-olive-600" />
                居留类型分布
              </h3>
              <div className="h-64 flex items-center justify-center">
                {residenceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={residenceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {residenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-earth-400 text-sm">暂无数据</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="section-title text-lg mb-4">
              <BarChart3 className="w-5 h-5 text-olive-600" />
              {year}年 年度概览
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-olive-50 rounded-xl">
                <p className="text-3xl font-serif font-bold text-olive-700">
                  {stats.yearSpeciesCount}
                </p>
                <p className="text-sm text-earth-500 mt-1">观察鸟种</p>
              </div>
              <div className="text-center p-4 bg-earth-50 rounded-xl">
                <p className="text-3xl font-serif font-bold text-earth-700">
                  {stats.yearJournalsCount}
                </p>
                <p className="text-sm text-earth-500 mt-1">观鸟次数</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <p className="text-3xl font-serif font-bold text-amber-700">
                  {stats.yearObservationsCount}
                </p>
                <p className="text-sm text-earth-500 mt-1">观察记录</p>
              </div>
              <div className="text-center p-4 bg-cream-100 rounded-xl">
                <p className="text-3xl font-serif font-bold text-earth-700">
                  {Math.round((stats.yearMinutes / 60) * 10) / 10}
                  h
                </p>
                <p className="text-sm text-earth-500 mt-1">观鸟时长</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
