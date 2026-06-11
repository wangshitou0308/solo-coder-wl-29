import { useEffect, useState } from "react";
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
} from "lucide-react";
import { LoadingSpinner, PageHeader, StatCard } from "@/components/Common";
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
} from "recharts";
import { getCurrentYear, getMonthKey } from "@/utils/date";
import { getGeneraByFamily, getFamiliesByOrder } from "@/utils/db";
import type { BirdGenus, BirdFamily } from "@/types";

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

export default function Statistics() {
  const { init, loading, allSpecies, userSpeciesRecords, journals, observations, orders, getFamilies, getGenera } = useAppStore();
  const [year, setYear] = useState(getCurrentYear());
  const [familyCount, setFamilyCount] = useState(0);
  const [genusCount, setGenusCount] = useState(0);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    calculateFamilyGenusCount();
  }, [userSpeciesRecords, allSpecies, orders]);

  const calculateFamilyGenusCount = async () => {
    const observedSpecies = userSpeciesRecords
      .map((r) => allSpecies.find((s) => s.id === r.species_id))
      .filter((s): s is NonNullable<typeof s> => !!s);

    const genusIds = new Set(observedSpecies.map((s) => s.genus_id));
    setGenusCount(genusIds.size);

    const familySet = new Set<string>();
    for (const order of orders) {
      const families = await getFamilies(order.id);
      for (const family of families) {
        const genera = await getGenera(family.id);
        const genusIdSet = new Set(genera.map((g) => g.id));
        for (const sp of observedSpecies) {
          if (genusIdSet.has(sp.genus_id)) {
            familySet.add(family.id);
            break;
          }
        }
      }
    }

    setFamilyCount(familySet.size);
  };

  const totalSpecies = userSpeciesRecords.length;
  const totalJournals = journals.length;

  const observedSpecies = userSpeciesRecords
    .map((r) => allSpecies.find((s) => s.id === r.species_id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  let totalMinutes = 0;
  for (const j of journals) {
    const dur = (new Date(j.end_time).getTime() - new Date(j.start_time).getTime()) / 60000;
    if (dur > 0) totalMinutes += dur;
  }

  const yearJournals = journals.filter(
    (j) => new Date(j.start_time).getFullYear() === year
  );

  const yearObservations = observations.filter((o) => {
    const journal = journals.find((j) => j.id === o.journal_id);
    if (!journal) return false;
    return new Date(journal.start_time).getFullYear() === year;
  });

  const yearSpeciesIds = new Set(yearObservations.map((o) => o.species_id));

  const monthData = [];
  for (let i = 1; i <= 12; i++) {
    const monthKey = `${year}-${String(i).padStart(2, "0")}`;
    const monthJournals = journals.filter((j) => getMonthKey(j.start_time) === monthKey);
    const monthObsIds = new Set<string>();
    let monthMinutes = 0;

    for (const j of monthJournals) {
      const dur = (new Date(j.end_time).getTime() - new Date(j.start_time).getTime()) / 60000;
      if (dur > 0) monthMinutes += dur;
      const jObs = observations.filter((o) => o.journal_id === j.id);
      jObs.forEach((o) => monthObsIds.add(o.species_id));
    }

    monthData.push({
      month: `${i}月`,
      观察次数: monthJournals.length,
      新鸟种: monthObsIds.size,
      观鸟时长: Math.round((monthMinutes / 60) * 10) / 10,
    });
  }

  const habitatData: { name: string; value: number; color: string }[] = [];
  const habitatCount: Record<string, number> = {};
  for (const sp of observedSpecies) {
    const key = sp.habitat_type;
    habitatCount[key] = (habitatCount[key] || 0) + 1;
  }
  for (const [key, value] of Object.entries(habitatCount)) {
    habitatData.push({
      name: HabitatTypeLabels[key as HabitatType] || key,
      value,
      color: HABITAT_COLORS[key as HabitatType] || "#999",
    });
  }

  const residenceData: { name: string; value: number; color: string }[] = [];
  const residenceCount: Record<string, number> = {};
  for (const sp of observedSpecies) {
    const key = sp.residence_type;
    residenceCount[key] = (residenceCount[key] || 0) + 1;
  }
  for (const [key, value] of Object.entries(residenceCount)) {
    residenceData.push({
      name: ResidenceTypeLabels[key as ResidenceType] || key,
      value,
      color: RESIDENCE_COLORS[key as ResidenceType] || "#999",
    });
  }

  if (loading && !allSpecies.length) {
    return <LoadingSpinner />;
  }

  const years = Array.from(
    new Set(journals.map((j) => new Date(j.start_time).getFullYear()))
  ).sort((a, b) => b - a);
  if (!years.includes(getCurrentYear())) {
    years.unshift(getCurrentYear());
  }

  return (
    <div className="animate-slide-up">
      <PageHeader title="观鸟统计" subtitle="追踪你的观鸟旅程">
        <div className="flex items-center gap-2">
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
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Feather} value={totalSpecies} label="累计鸟种" color="olive" />
        <StatCard icon={BookOpen} value={totalJournals} label="观鸟日记" color="earth" />
        <StatCard icon={TreeDeciduous} value={familyCount} label="覆盖科数" color="amber" />
        <StatCard
          icon={Clock}
          value={`${Math.floor(totalMinutes / 60)}h`}
          label="累计时长"
          color="cream"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="section-title text-lg mb-4">
            <Calendar className="w-5 h-5 text-olive-600" />
            {year}年 月度统计
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData}>
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
            {year}年 新鸟种趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthData}>
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
                <Line
                  type="monotone"
                  dataKey="新鸟种"
                  stroke="#C4A35A"
                  strokeWidth={2}
                  dot={{ fill: "#C4A35A" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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
              {yearSpeciesIds.size}
            </p>
            <p className="text-sm text-earth-500 mt-1">观察鸟种</p>
          </div>
          <div className="text-center p-4 bg-earth-50 rounded-xl">
            <p className="text-3xl font-serif font-bold text-earth-700">
              {yearJournals.length}
            </p>
            <p className="text-sm text-earth-500 mt-1">观鸟次数</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <p className="text-3xl font-serif font-bold text-amber-700">
              {yearObservations.length}
            </p>
            <p className="text-sm text-earth-500 mt-1">观察记录</p>
          </div>
          <div className="text-center p-4 bg-cream-100 rounded-xl">
            <p className="text-3xl font-serif font-bold text-earth-700">
              {
                Math.round(
                  yearJournals.reduce((sum, j) => {
                    const dur =
                      (new Date(j.end_time).getTime() -
                        new Date(j.start_time).getTime()) /
                      3600000;
                    return sum + (dur > 0 ? dur : 0);
                  }, 0) * 10
                ) / 10
              }
              h
            </p>
            <p className="text-sm text-earth-500 mt-1">观鸟时长</p>
          </div>
        </div>
      </div>
    </div>
  );
}
