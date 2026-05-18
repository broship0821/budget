// ── Dashboard ──────────────────────────────────────────────────────
export const DUMMY_PORTFOLIO_RECORDS = [
  { id: 1, date: "2025-10-31", amount: 42300000, dailyReturn: null },
  { id: 2, date: "2025-11-28", amount: 44100000, dailyReturn: 4.26 },
  { id: 3, date: "2025-12-31", amount: 46700000, dailyReturn: 5.90 },
  { id: 4, date: "2026-01-31", amount: 48200000, dailyReturn: 3.21 },
  { id: 5, date: "2026-02-28", amount: 50900000, dailyReturn: 5.60 },
  { id: 6, date: "2026-03-31", amount: 52400000, dailyReturn: 2.95 },
  { id: 7, date: "2026-04-30", amount: 54600000, dailyReturn: 4.20 },
  { id: 8, date: "2026-05-15", amount: 56100000, dailyReturn: 2.75 },
];

export const DUMMY_MEMOS = {
  goal: "올해 목표: 7천만원 달성\n연 수익률 20% 이상 유지",
  thought: "시장이 불확실하지만 꾸준히 분산 투자 중...",
};

// ── Assets ─────────────────────────────────────────────────────────
export const DUMMY_ASSET_ITEMS = [
  { id: 1, name: "주식계좌", order: 0 },
  { id: 2, name: "예금", order: 1 },
  { id: 3, name: "CMA", order: 2 },
  { id: 4, name: "비상금", order: 3 },
];

export const DUMMY_ASSET_RECORDS: Record<number, number> = {
  1: 32500000,
  2: 15000000,
  3: 5200000,
  4: 3400000,
};

export const DUMMY_ASSET_HISTORY = [
  { year: 2025, month: 10, total: 48300000, byItem: { 1: 28000000, 2: 15000000, 3: 3300000, 4: 2000000 }, label: "25.10", change: null },
  { year: 2025, month: 11, total: 50100000, byItem: { 1: 29800000, 2: 15000000, 3: 3500000, 4: 1800000 }, label: "25.11", change: 1800000 },
  { year: 2025, month: 12, total: 51800000, byItem: { 1: 31200000, 2: 15000000, 3: 3800000, 4: 1800000 }, label: "25.12", change: 1700000 },
  { year: 2026, month: 1,  total: 53200000, byItem: { 1: 32000000, 2: 15000000, 3: 4400000, 4: 1800000 }, label: "26.01", change: 1400000 },
  { year: 2026, month: 2,  total: 54000000, byItem: { 1: 32500000, 2: 15000000, 3: 4700000, 4: 1800000 }, label: "26.02", change: 800000 },
  { year: 2026, month: 3,  total: 54900000, byItem: { 1: 33100000, 2: 15000000, 3: 5000000, 4: 1800000 }, label: "26.03", change: 900000 },
  { year: 2026, month: 4,  total: 55500000, byItem: { 1: 33200000, 2: 15000000, 3: 5100000, 4: 2200000 }, label: "26.04", change: 600000 },
  { year: 2026, month: 5,  total: 56100000, byItem: { 1: 32500000, 2: 15000000, 3: 5200000, 4: 3400000 }, label: "26.05", change: 600000 },
];

// ── Budget ─────────────────────────────────────────────────────────
export const DUMMY_BUDGET_CATEGORIES = [
  { id: 1, name: "식비",    order: 0 },
  { id: 2, name: "교통비",  order: 1 },
  { id: 3, name: "문화/여가", order: 2 },
  { id: 4, name: "쇼핑",    order: 3 },
  { id: 5, name: "카페",    order: 4 },
  { id: 6, name: "생활",    order: 5 },
];

export const DUMMY_EXPENSES: Record<string, number> = {
  "식비":    380000,
  "교통비":  85000,
  "문화/여가": 120000,
  "쇼핑":    240000,
  "카페":    65000,
  "생활":    190000,
};

export const DUMMY_EXPENSE_HISTORY = [
  { year: 2025, month: 10, total: 1020000, label: "25.10", change: null },
  { year: 2025, month: 11, total: 980000,  label: "25.11", change: -40000 },
  { year: 2025, month: 12, total: 1150000, label: "25.12", change: 170000 },
  { year: 2026, month: 1,  total: 890000,  label: "26.01", change: -260000 },
  { year: 2026, month: 2,  total: 970000,  label: "26.02", change: 80000 },
  { year: 2026, month: 3,  total: 1040000, label: "26.03", change: 70000 },
  { year: 2026, month: 4,  total: 1060000, label: "26.04", change: 20000 },
  { year: 2026, month: 5,  total: 1080000, label: "26.05", change: 20000 },
];
