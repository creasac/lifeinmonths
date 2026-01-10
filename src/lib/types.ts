export interface CellData {
  color: string;
  label?: string;
}

export interface CellDataMap {
  [key: string]: CellData; // key format: "month-year"
}

export interface UserProfile {
  username: string;
  dateOfBirth: string | null;
  expectedLifeYears: number;
  cellData: CellDataMap;
}

export interface GridCell {
  month: number; // 0-11
  year: number; // 0-99
  isLived: boolean;
  customData?: CellData;
}
