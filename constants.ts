
import { CabinStatus, Role } from "./types";

export const CABIN_DEFINITIONS = [
  { name: "شوکا", icon: "Mountain" },      // Deer -> Mountain/Nature
  { name: "میچکا", icon: "Bird" },         // Sparrow -> Bird
  { name: "پاپلی", icon: "Flower" },       // Butterfly -> Flower
  { name: "اوپاچ", icon: "Cloud" },        // Local/Abstract -> Cloud
  { name: "زیک", icon: "Feather" },        // Bird -> Feather
  { name: "سرخدار", icon: "TreePine" },    // Yew Tree -> Pine Tree
  { name: "شمشاد", icon: "TreeDeciduous" },// Boxwood -> Deciduous Tree
  { name: "مرال", icon: "Crown" },         // Red Deer -> Crown (King)
  { name: "نمازین", icon: "Sun" }          // Prayer -> Sun/Light
];

export const CABIN_NAMES = CABIN_DEFINITIONS.map(d => d.name);

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: "مدیر سیستم",
  [Role.RECEPTION]: "پذیرش",
  [Role.HOUSEKEEPING]: "خانه‌دار",
  [Role.TECHNICAL]: "تاسیسات / فنی",
};

export const STATUS_LABELS: Record<CabinStatus, string> = {
  [CabinStatus.OCCUPIED]: "پر (مهمان دارد)",
  [CabinStatus.EMPTY_DIRTY]: "خالی (نظافت نشده)",
  [CabinStatus.EMPTY_CLEAN]: "خالی (آماده)",
  [CabinStatus.ISSUE_TECH]: "مشکل فنی",
  [CabinStatus.ISSUE_CLEAN]: "مشکل نظافتی",
  [CabinStatus.UNDER_MAINTENANCE]: "در حال بررسی",
};

export const STATUS_COLORS: Record<CabinStatus, string> = {
  [CabinStatus.OCCUPIED]: "bg-red-100 text-red-800 border-red-200",
  [CabinStatus.EMPTY_DIRTY]: "bg-orange-100 text-orange-800 border-orange-200",
  [CabinStatus.EMPTY_CLEAN]: "bg-emerald-100 text-emerald-800 border-emerald-200",
  [CabinStatus.ISSUE_TECH]: "bg-slate-800 text-white border-slate-600",
  [CabinStatus.ISSUE_CLEAN]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [CabinStatus.UNDER_MAINTENANCE]: "bg-blue-100 text-blue-800 border-blue-200",
};

export const CLEANING_ITEMS = [
    "شست‌وشوی ظروف و نظافت سینک",
    "پُر بودن مایع ظرفشویی و دستشویی",
    "شست‌وشوی سرویس بهداشتی و شیرآلات",
    "خالی بودن سطل زباله‌ها",
    "بررسی روتختی، روبالشی و لوازم خواب",
    "عدم وجود تار عنکبوت (سقف/سرویس)",
    "بررسی بوی مطبوع کلبه",
    "تکمیل ظروف کلبه و یخچال",
    "موجودی: کبریت، چای، ملحفه، نمک، فلفل",
    "نظافت مبل، فرش و کف اتاق",
    "نظافت پرده و شیشه‌ها",
    "نظافت یخچال و عدم برفک‌زدگی",
    "گردگیری کامل (تلویزیون، میز، آینه)",
    "نظافت دمپایی و جا کفشی",
    "تکمیل هیزم، زغال و نفت",
    "نظافت حیاط، کتری، قوری و باربیکیو"
];
