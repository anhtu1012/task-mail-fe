import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type DrawMode =
  | "SELECT"
  | "DRAW"
  | "ERASE"
  | "RF"
  | "CNT20"
  | "CNT45"
  | "HC"
  | "DG";

export interface SlotData {
  nCD: string;
  shipCD: string;
  cBay: string;
  /** "D" = Deck (Boong), "H" = Hold (Hầm), "N" = Nắp hầm */
  cLoai: "D" | "H" | "N";
  cRow: string;   // "00","01","02",...
  cTier: string;  // "82","84","86","88" (Deck) | "02","04",... (Hold)
  position: string;
  cntRf: boolean;
  cCnt20: boolean;
  cCnt45: boolean;
  cCntHc: boolean;
  cCntDg: boolean;
  weight: number | null;
  /** true = slot đã được kích hoạt (có trong sơ đồ) */
  active: boolean;
  /** true = slot bị khóa, không thể bị ghi đè hay xóa */
  locked: boolean;
}

/** Mỗi bay raw từ API */
export interface BayRaw {
  id: number;
  bayAmount: string;   // "01","02",...
  hatchAmount: number; // số nắp hầm
  maxHoldTier: number; // số tier hầm (0 = không có hầm)
}

/** Cấu trúc đầy đủ của 1 bay sau khi build */
export interface BayDesign {
  id: number;
  bayNo: string;         // "01","02",...
  hatchAmount: number;
  maxHoldTier: number;
  globalMaxHoldTier: number;
  /** Whether center row 00 is visible */
  hasRow00: boolean;
  /** key = "cLoai-cRow-cTier", value = SlotData */
  slots: Record<string, SlotData>;
}

interface ShipDesignState {
  /** Danh sách bay raw từ data */
  bayList: BayRaw[];
  /** Map bay → design data đã build */
  bayDesigns: Record<string, BayDesign>;
  /** Bay đang active */
  activeBayNo: string;
  /** Chế độ vẽ */
  drawMode: DrawMode;
  /** Slot đang được chọn đơn lẻfor detail panel */
  selectedSlotKey: string | null;
  /** Tập hợp các slot keys được chọn (marquee) */
  selectedKeys: string[];
  /** ship code */
  shipCD: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Rows chuẩn của tàu:
 * Port (chẵn, lớn→nhỏ): 24,22,...,02
 * Center: 00
 * Starboard (lẻ, nhỏ→lớn): 01,03,...,23
 */
export const STANDARD_ROWS = [
  "24","22","20","18","16","14","12","10","08","06","04","02",
  "00",
  "01","03","05","07","09","11","13","15","17","19","21","23",
];

/**
 * Build tier list cho Deck: 17 tiers từ 114 xuống 82 (bước 2)
 * Hiển thị từ trên xuống (tier cao = trên cùng)
 */
export const buildDeckTiers = (): string[] => {
  const tiers: string[] = [];
  for (let t = 114; t >= 82; t -= 2) {
    tiers.push(String(t));
  }
  return tiers; // ["114","112",...,"82"] — 17 items
};

/** Build tier list cho Hold: dựa vào globalMaxHoldTier và localMaxHoldTier */
export const buildHoldTiers = (globalMaxHoldTier: number, localMaxHoldTier: number): string[] => {
  if (localMaxHoldTier === 0) return [];
  const tiers: string[] = [];
  let currentTierValue = globalMaxHoldTier * 2;
  for (let i = 0; i < localMaxHoldTier; i++) {
    tiers.push(String(currentTierValue).padStart(2, "0"));
    currentTierValue -= 2;
  }
  return tiers; // e.g. ["06","04"] for global=3, local=2
};

/** Tạo slot key */
export const slotKey = (cLoai: string, cRow: string, cTier: string): string =>
  `${cLoai}-${cRow}-${cTier}`;

/** Build BayDesign từ BayRaw (slots rỗng) */
function buildBayDesign(raw: BayRaw, shipCD: string, globalMaxHoldTier: number): BayDesign {
  const slots: Record<string, SlotData> = {};
  const deckTiers = buildDeckTiers();
  const holdTiers = buildHoldTiers(globalMaxHoldTier, raw.maxHoldTier);

  // Deck slots
  for (const row of STANDARD_ROWS) {
    for (const tier of deckTiers) {
      const key = slotKey("D", row, tier);
      slots[key] = {
        nCD: "",
        shipCD,
        cBay: raw.bayAmount,
        cLoai: "D",
        cRow: row,
        cTier: tier,
        position: `D-${row}-${tier}`,
        cntRf: false,
        cCnt20: false,
        cCnt45: false,
        cCntHc: false,
        cCntDg: false,
        weight: null,
        active: false,
        locked: false,
      };
    }
  }

  // Nắp hầm slot placeholder (cLoai="N") – 1 row per standard row
  for (const row of STANDARD_ROWS) {
    const key = slotKey("N", row, "00");
    slots[key] = {
      nCD: "",
      shipCD,
      cBay: raw.bayAmount,
      cLoai: "N",
      cRow: row,
      cTier: "00",
      position: `N-${row}-00`,
      cntRf: false,
      cCnt20: false,
      cCnt45: false,
      cCntHc: false,
      cCntDg: false,
      weight: null,
      active: false,
      locked: false,
    };
  }

  // Hold slots
  for (const row of STANDARD_ROWS) {
    for (const tier of holdTiers) {
      const key = slotKey("H", row, tier);
      slots[key] = {
        nCD: "",
        shipCD,
        cBay: raw.bayAmount,
        cLoai: "H",
        cRow: row,
        cTier: tier,
        position: `H-${row}-${tier}`,
        cntRf: false,
        cCnt20: false,
        cCnt45: false,
        cCntHc: false,
        cCntDg: false,
        weight: null,
        active: false,
        locked: false,
      };
    }
  }

  return {
    id: raw.id,
    bayNo: raw.bayAmount,
    hatchAmount: raw.hatchAmount,
    maxHoldTier: raw.maxHoldTier,
    globalMaxHoldTier,
    hasRow00: true,
    slots,
  };
}

/* ------------------------------------------------------------------ */
/*  Default bay list                                                     */
/* ------------------------------------------------------------------ */
const DEFAULT_BAY_LIST: BayRaw[] = [
  { id: 16427, bayAmount: "01", hatchAmount: 1, maxHoldTier: 2 },
  { id: 16426, bayAmount: "02", hatchAmount: 1, maxHoldTier: 2 },
  { id: 16425, bayAmount: "03", hatchAmount: 1, maxHoldTier: 2 },
  { id: 16423, bayAmount: "05", hatchAmount: 2, maxHoldTier: 3 },
  { id: 16424, bayAmount: "06", hatchAmount: 2, maxHoldTier: 3 },
  { id: 16428, bayAmount: "07", hatchAmount: 2, maxHoldTier: 3 },
  { id: 16430, bayAmount: "09", hatchAmount: 3, maxHoldTier: 3 },
  { id: 16429, bayAmount: "10", hatchAmount: 3, maxHoldTier: 3 },
  { id: 16432, bayAmount: "11", hatchAmount: 3, maxHoldTier: 3 },
  { id: 16431, bayAmount: "13", hatchAmount: 4, maxHoldTier: 3 },
  { id: 16433, bayAmount: "14", hatchAmount: 4, maxHoldTier: 3 },
  { id: 16434, bayAmount: "15", hatchAmount: 4, maxHoldTier: 3 },
  { id: 16435, bayAmount: "17", hatchAmount: 5, maxHoldTier: 3 },
  { id: 16437, bayAmount: "18", hatchAmount: 5, maxHoldTier: 3 },
  { id: 16436, bayAmount: "19", hatchAmount: 5, maxHoldTier: 3 },
  { id: 16438, bayAmount: "21", hatchAmount: 6, maxHoldTier: 3 },
  { id: 16439, bayAmount: "22", hatchAmount: 6, maxHoldTier: 3 },
  { id: 16440, bayAmount: "23", hatchAmount: 6, maxHoldTier: 3 },
  { id: 16441, bayAmount: "25", hatchAmount: 7, maxHoldTier: 0 },
  { id: 16442, bayAmount: "26", hatchAmount: 7, maxHoldTier: 0 },
  { id: 16443, bayAmount: "27", hatchAmount: 7, maxHoldTier: 0 },
];

const DEFAULT_SHIP_CD = "BDFO";

function buildInitialDesigns(
  bayList: BayRaw[],
  shipCD: string
): Record<string, BayDesign> {
  const globalMaxHoldTier = Math.max(0, ...bayList.map((b) => b.maxHoldTier));
  const result: Record<string, BayDesign> = {};
  for (const raw of bayList) {
    result[raw.bayAmount] = buildBayDesign(raw, shipCD, globalMaxHoldTier);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Slot mutation helpers (dùng trong reducers)                         */
/* ------------------------------------------------------------------ */
function applyMode(mode: DrawMode, slot: SlotData) {
  // Nếu bị khóa và mode không phải là SELECT (Khóa) thì bỏ qua
  if (slot.locked && mode !== "SELECT") return;

  switch (mode) {
    case "DRAW":
      slot.active = true;
      break;
    case "ERASE":
      clearSlot(slot);
      break;
    case "RF":
      slot.active = true;
      slot.cntRf = true;
      break;
    case "CNT20":
      slot.active = true;
      slot.cCnt20 = true;
      break;
    case "CNT45":
      slot.active = true;
      slot.cCnt45 = true;
      break;
    case "HC":
      slot.active = true;
      slot.cCntHc = true;
      break;
    case "DG":
      slot.active = true;
      slot.cCntDg = true;
      break;
    case "SELECT":
      // SELECT mode hoạt động như tính năng Khóa
      slot.locked = !slot.locked;
      break;
  }
}

function clearSlot(slot: SlotData) {
  if (slot.locked) return; // Không thể xóa ô đang khóa
  slot.active = false;
  slot.cntRf  = false;
  slot.cCnt20 = false;
  slot.cCnt45 = false;
  slot.cCntHc = false;
  slot.cCntDg = false;
  slot.weight = null;
  slot.nCD    = "";
}



/* ------------------------------------------------------------------ */
/*  Initial state                                                        */
/* ------------------------------------------------------------------ */
const initialState: ShipDesignState = {
  bayList: DEFAULT_BAY_LIST,
  bayDesigns: buildInitialDesigns(DEFAULT_BAY_LIST, DEFAULT_SHIP_CD),
  activeBayNo: DEFAULT_BAY_LIST[0].bayAmount,
  drawMode: "DRAW",
  selectedSlotKey: null,
  selectedKeys: [],
  shipCD: DEFAULT_SHIP_CD,
};

/* ------------------------------------------------------------------ */
/*  Slice                                                                */
/* ------------------------------------------------------------------ */
const shipDesignSlice = createSlice({
  name: "shipDesign",
  initialState,
  reducers: {
    /** Chuyển bay đang xem */
    setActiveBay(state, action: PayloadAction<string>) {
      state.activeBayNo = action.payload;
      state.selectedSlotKey = null;
    },

    /** Đổi chế độ vẽ */
    setDrawMode(state, action: PayloadAction<DrawMode>) {
      state.drawMode = action.payload;
    },

    /** Vẽ / apply mode lên 1 slot */
    paintSlot(
      state,
      action: PayloadAction<{ bayNo: string; key: string }>
    ) {
      const { bayNo, key } = action.payload;
      const bay = state.bayDesigns[bayNo];
      if (!bay) return;
      const slot = bay.slots[key];
      if (!slot) return;
      applyMode(state.drawMode, slot);
    },

    /** Vẽ / apply mode lên nhiều slots (batch — dùng cho marquee) */
    paintSlotBatch(
      state,
      action: PayloadAction<{ bayNo: string; keys: string[] }>
    ) {
      const { bayNo, keys } = action.payload;
      const bay = state.bayDesigns[bayNo];
      if (!bay) return;
      for (const key of keys) {
        const slot = bay.slots[key];
        if (slot) applyMode(state.drawMode, slot);
      }
      state.selectedKeys = [];
    },

    /** Xóa slot (chuột phải) */
    eraseSlot(
      state,
      action: PayloadAction<{ bayNo: string; key: string }>
    ) {
      const { bayNo, key } = action.payload;
      const bay = state.bayDesigns[bayNo];
      if (!bay) return;
      const slot = bay.slots[key];
      if (!slot) return;
      clearSlot(slot);
    },

    /** Xóa nhiều slots (batch — dùng cho marquee) */
    eraseSlotBatch(
      state,
      action: PayloadAction<{ bayNo: string; keys: string[] }>
    ) {
      const { bayNo, keys } = action.payload;
      const bay = state.bayDesigns[bayNo];
      if (!bay) return;
      for (const key of keys) {
        const slot = bay.slots[key];
        if (slot) clearSlot(slot);
      }
      state.selectedKeys = [];
    },

    /** Chọn 1 slot để xem detail */
    selectSlot(state, action: PayloadAction<string | null>) {
      state.selectedSlotKey = action.payload;
    },

    /** Chọn nhiều slots (từ marquee) */
    selectSlotBatch(state, action: PayloadAction<string[]>) {
      state.selectedKeys = action.payload;
      state.selectedSlotKey =
        action.payload.length === 1 ? action.payload[0] : null;
    },

    /** Xóa toàn bộ selected */
    clearSelectedKeys(state) {
      state.selectedKeys = [];
      state.selectedSlotKey = null;
    },

    /** Load bay list mới từ API */
    loadBayList(
      state,
      action: PayloadAction<{ bayList: BayRaw[]; shipCD: string }>
    ) {
      const { bayList, shipCD } = action.payload;
      state.bayList = bayList;
      state.shipCD = shipCD;
      state.bayDesigns = buildInitialDesigns(bayList, shipCD);
      state.activeBayNo = bayList[0]?.bayAmount ?? "";
      state.selectedSlotKey = null;
    },

    /** Đặt lại toàn bộ bay về rỗng */
    resetBayDesign(state, action: PayloadAction<string>) {
      const bayNo = action.payload;
      const raw = state.bayList.find((b) => b.bayAmount === bayNo);
      if (!raw) return;
      const globalMaxHoldTier = Math.max(0, ...state.bayList.map((b) => b.maxHoldTier));
      state.bayDesigns[bayNo] = buildBayDesign(raw, state.shipCD, globalMaxHoldTier);
    },

    toggleRow00: (state, action: PayloadAction<string>) => {
      const bay = state.bayDesigns[action.payload];
      if (bay) {
        bay.hasRow00 = !bay.hasRow00;
        // Nếu xóa trục, clear các giá trị đang có trên cột trục 00
        if (!bay.hasRow00) {
          for (const key in bay.slots) {
            const slot = bay.slots[key];
            if (slot.cRow === "00") {
              slot.active = false;
              slot.locked = false;
              slot.cntRf = false;
              slot.cCnt20 = false;
              slot.cCnt45 = false;
              slot.cCntHc = false;
              slot.cCntDg = false;
            }
          }
        }
      }
    },
  },
});

export const {
  setActiveBay,
  setDrawMode,
  paintSlot,
  paintSlotBatch,
  eraseSlot,
  eraseSlotBatch,
  selectSlot,
  selectSlotBatch,
  clearSelectedKeys,
  loadBayList,
  resetBayDesign,
  toggleRow00,
} = shipDesignSlice.actions;

/* Selectors */
export const selectShipDesign = (state: RootState) => state.shipDesign;
export const selectActiveBay = (state: RootState) =>
  state.shipDesign.bayDesigns[state.shipDesign.activeBayNo];
export const selectDrawMode = (state: RootState) => state.shipDesign.drawMode;
export const selectBayList = (state: RootState) => state.shipDesign.bayList;

export default shipDesignSlice.reducer;
