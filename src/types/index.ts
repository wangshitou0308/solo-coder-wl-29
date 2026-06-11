export interface BirdOrder {
  id: string;
  name_cn: string;
  name_latin: string;
}

export interface BirdFamily {
  id: string;
  order_id: string;
  name_cn: string;
  name_latin: string;
}

export interface BirdGenus {
  id: string;
  family_id: string;
  name_cn: string;
  name_latin: string;
}

export interface BirdSpecies {
  id: string;
  genus_id: string;
  name_cn: string;
  name_latin: string;
  common_name?: string;
  habitat_type: HabitatType;
  residence_type: ResidenceType;
  conservation_status: ConservationStatus;
  description: string;
  image_url?: string;
  is_common: boolean;
}

export type HabitatType =
  | "forest"
  | "wetland"
  | "grassland"
  | "urban"
  | "mountain"
  | "coastal"
  | "farmland";

export type ResidenceType = "resident" | "summer_visitor" | "winter_visitor" | "passage_migrant";

export type ConservationStatus = "LC" | "NT" | "VU" | "EN" | "CR";

export interface BirdingJournal {
  id: string;
  location: string;
  latitude?: string;
  longitude?: string;
  weather: string;
  habitat_type: HabitatType;
  companions: string;
  start_time: string;
  end_time: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BirdObservation {
  id: string;
  journal_id: string;
  species_id: string;
  count: number;
  behavior: string;
  photo_url?: string;
  notes: string;
  created_at: string;
}

export interface UserSpeciesRecord {
  species_id: string;
  first_observed_at: string;
  first_location: string;
  total_observations: number;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  brand: string;
  model: string;
  purchase_date: string;
  usage_count: number;
  shutter_count?: number;
  notes: string;
  created_at: string;
}

export type EquipmentType = "binoculars" | "camera" | "lens" | "tripod" | "other";

export const HabitatTypeLabels: Record<HabitatType, string> = {
  forest: "森林",
  wetland: "湿地",
  grassland: "草原",
  urban: "城市",
  mountain: "山地",
  coastal: "海岸",
  farmland: "农田",
};

export const ResidenceTypeLabels: Record<ResidenceType, string> = {
  resident: "留鸟",
  summer_visitor: "夏候鸟",
  winter_visitor: "冬候鸟",
  passage_migrant: "旅鸟",
};

export const ConservationStatusLabels: Record<ConservationStatus, string> = {
  LC: "无危",
  NT: "近危",
  VU: "易危",
  EN: "濒危",
  CR: "极危",
};

export const EquipmentTypeLabels: Record<EquipmentType, string> = {
  binoculars: "望远镜",
  camera: "相机",
  lens: "镜头",
  tripod: "三脚架",
  other: "其他",
};

export const WeatherOptions = [
  "晴",
  "多云",
  "阴",
  "小雨",
  "中雨",
  "大雨",
  "雾",
  "雷阵雨",
];

export const BehaviorOptions = [
  "觅食",
  "栖息",
  "飞行",
  "鸣叫",
  "筑巢",
  "育雏",
  "争斗",
  "戏水",
  "迁徙",
];
