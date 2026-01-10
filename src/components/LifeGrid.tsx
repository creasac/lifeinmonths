"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { CellDataMap } from "@/lib/types";
import { getCellKey, calculateMonthsLived, getCurrentMonthProgress } from "@/lib/utils";

interface LifeGridProps {
  expectedLifeYears: number;
  dateOfBirth: string | null;
  cellData: CellDataMap;
  onCellDataChange?: (cellData: CellDataMap) => void;
  isEditable?: boolean;
}

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

// Full month names for labels and hover
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Circle cell component with optional partial fill (clock style)
function CircleCell({
  isLived,
  isCurrent,
  isSelected,
  customColor,
  progress,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  isLived: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  customColor?: string;
  progress?: { daysElapsed: number; daysInMonth: number };
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const size = 14;
  const strokeWidth = 1.5;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Calculate arc for partial fill (clock style)
  const getArcPath = (fraction: number) => {
    if (fraction >= 1) return null;
    if (fraction <= 0) return null;
    
    const angle = fraction * 360;
    const radians = (angle - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(radians);
    const y = center + radius * Math.sin(radians);
    const largeArc = angle > 180 ? 1 : 0;
    
    return `M ${center} ${center} L ${center} ${center - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y} Z`;
  };

  let fillColor = "white";
  let strokeColor = "#374151"; // Always dark border
  
  if (isSelected) {
    fillColor = "#FCD34D";
    strokeColor = "#B45309";
  } else if (customColor) {
    fillColor = customColor;
    // Keep dark border for colored cells
  } else if (isLived && !isCurrent) {
    fillColor = "#DC2626";
    // Keep dark border for lived cells too
  }

  return (
    <svg
      width={size}
      height={size}
      className="cursor-pointer transition-transform hover:scale-125 hover:z-10"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ overflow: "visible" }}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={isCurrent && !customColor ? "white" : fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {isCurrent && !customColor && progress && progress.daysElapsed < progress.daysInMonth && (
        <path
          d={getArcPath(progress.daysElapsed / progress.daysInMonth) || ""}
          fill="#DC2626"
        />
      )}
      {isCurrent && !customColor && progress && progress.daysElapsed >= progress.daysInMonth && (
        <circle
          cx={center}
          cy={center}
          r={radius - strokeWidth / 2}
          fill="#DC2626"
        />
      )}
    </svg>
  );
}

export function LifeGrid({
  expectedLifeYears,
  dateOfBirth,
  cellData,
  onCellDataChange,
  isEditable = false,
}: LifeGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ month: number; year: number } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Get colors already used in cellData
  const usedColors = useMemo(() => {
    const colors = new Set<string>();
    Object.values(cellData).forEach(cell => {
      if (cell.color) {
        colors.add(cell.color.toUpperCase());
      }
    });
    return colors;
  }, [cellData]);

  // Get the next available color from presets, or generate a smart alternative
  const getNextAvailableColor = useCallback(() => {
    // First, try to find an unused preset color
    for (const color of PRESET_COLORS) {
      if (!usedColors.has(color.toUpperCase())) {
        return color;
      }
    }
    
    // All preset colors are used - generate a variation
    // Pick a random hue that's different from existing colors
    const usedHues = Array.from(usedColors).map(color => {
      // Convert hex to HSL and get hue
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      if (max !== min) {
        const d = max - min;
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
      }
      return Math.round(h * 360);
    });
    
    // Find the largest gap in hues
    const sortedHues = [...usedHues].sort((a, b) => a - b);
    let maxGap = 0;
    let bestHue = 0;
    
    for (let i = 0; i < sortedHues.length; i++) {
      const nextIndex = (i + 1) % sortedHues.length;
      const gap = nextIndex === 0 
        ? (360 - sortedHues[i] + sortedHues[0]) 
        : (sortedHues[nextIndex] - sortedHues[i]);
      if (gap > maxGap) {
        maxGap = gap;
        bestHue = (sortedHues[i] + gap / 2) % 360;
      }
    }
    
    // Convert HSL to hex (saturation 70%, lightness 50%)
    const s = 0.7;
    const l = 0.5;
    const h = bestHue / 360;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }, [usedColors]);

  // Initialize customColor with next available
  const [customColor, setCustomColor] = useState(() => PRESET_COLORS[0]);
  
  // Update customColor when color picker opens to suggest next available
  useEffect(() => {
    if (showColorPicker) {
      setCustomColor(getNextAvailableColor());
    }
  }, [showColorPicker, getNextAvailableColor]);

  // Get birth month (0-11)
  const birthMonth = useMemo(() => {
    if (!dateOfBirth) return 0;
    return new Date(dateOfBirth).getMonth();
  }, [dateOfBirth]);

  // Get ordered month indices starting from birth month
  const orderedMonths = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push((birthMonth + i) % 12);
    }
    return months;
  }, [birthMonth]);

  const monthsLived = dateOfBirth
    ? calculateMonthsLived(new Date(dateOfBirth))
    : 0;

  const currentMonthProgress = dateOfBirth
    ? getCurrentMonthProgress(new Date(dateOfBirth))
    : null;

  const totalMonths = expectedLifeYears * 12;

  // Get month index in the grid (0-11 relative to birth month)
  const getGridRowIndex = (calendarMonth: number): number => {
    return (calendarMonth - birthMonth + 12) % 12;
  };

  // Get calendar month from grid row (0-11)
  const getCalendarMonth = (gridRow: number): number => {
    return (birthMonth + gridRow) % 12;
  };

  // Calculate month index (sequential from birth)
  const getMonthIndex = (gridRow: number, year: number) => year * 12 + gridRow;

  // Get the actual calendar date for a cell
  const getCellDate = useCallback((gridRow: number, year: number): Date | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const monthIndex = year * 12 + gridRow;
    const cellDate = new Date(birthDate);
    cellDate.setMonth(birthDate.getMonth() + monthIndex);
    return cellDate;
  }, [dateOfBirth]);

  // Get display text for a cell (used in selection info)
  const getCellDisplayText = (gridRow: number, year: number): string => {
    const calendarMonth = getCalendarMonth(gridRow);
    const key = getCellKey(gridRow, year);
    const customData = cellData[key];
    const cellDate = getCellDate(gridRow, year);
    
    let text = `${MONTH_FULL_NAMES[calendarMonth]}`;
    if (cellDate) {
      text += ` ${cellDate.getFullYear()}`;
    }
    text += ` (Age ${year})`;
    
    if (customData?.label) {
      text += ` — ${customData.label}`;
    }
    
    return text;
  };

  // Calculate all cells between two points
  const getCellsBetweenMonths = useCallback(
    (p1: { month: number; year: number }, p2: { month: number; year: number }): Set<string> => {
      const cells = new Set<string>();
      const idx1 = getMonthIndex(p1.month, p1.year);
      const idx2 = getMonthIndex(p2.month, p2.year);
      const minIdx = Math.min(idx1, idx2);
      const maxIdx = Math.max(idx1, idx2);

      for (let i = minIdx; i <= maxIdx; i++) {
        const year = Math.floor(i / 12);
        const gridRow = i % 12;
        if (i < totalMonths) {
          cells.add(getCellKey(gridRow, year));
        }
      }
      return cells;
    },
    [totalMonths]
  );

  const handleCellClick = useCallback(
    (gridRow: number, year: number) => {
      if (!isEditable) return;

      const clickedKey = getCellKey(gridRow, year);

      if (selectedCell === null) {
        setSelectedCell({ month: gridRow, year });
        setSelectedCells(new Set([clickedKey]));
      } else if (selectedCell.month === gridRow && selectedCell.year === year) {
        setShowColorPicker(true);
      } else {
        const cells = getCellsBetweenMonths(selectedCell, { month: gridRow, year });
        setSelectedCells(cells);
        setSelectedCell(null);
        setShowColorPicker(true);
      }
    },
    [isEditable, selectedCell, getCellsBetweenMonths]
  );

  const handleMouseEnter = useCallback(
    (gridRow: number, year: number) => {
      const key = getCellKey(gridRow, year);
      setHoveredCell(key);

      if (selectedCell && !showColorPicker) {
        const cells = getCellsBetweenMonths(selectedCell, { month: gridRow, year });
        setSelectedCells(cells);
      }
    },
    [selectedCell, showColorPicker, getCellsBetweenMonths]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const applyColor = useCallback(() => {
    if (!onCellDataChange) return;

    const newCellData = { ...cellData };
    selectedCells.forEach((key) => {
      newCellData[key] = { color: customColor, label: customLabel || undefined };
    });
    onCellDataChange(newCellData);
    setSelectedCells(new Set());
    setSelectedCell(null);
    setShowColorPicker(false);
    setCustomLabel("");
  }, [cellData, onCellDataChange, selectedCells, customColor, customLabel]);

  const clearSelectedCells = useCallback(() => {
    if (!onCellDataChange) return;

    const newCellData = { ...cellData };
    selectedCells.forEach((key) => {
      delete newCellData[key];
    });
    onCellDataChange(newCellData);
    setSelectedCells(new Set());
    setSelectedCell(null);
    setShowColorPicker(false);
    setCustomLabel("");
  }, [cellData, onCellDataChange, selectedCells]);

  const cancelSelection = useCallback(() => {
    setSelectedCells(new Set());
    setSelectedCell(null);
    setShowColorPicker(false);
    setCustomLabel("");
  }, []);

  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyColor();
      }
      if (e.key === "Escape") {
        cancelSelection();
      }
    },
    [applyColor, cancelSelection]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCell && !showColorPicker) {
        cancelSelection();
      }
    };
    
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedCell, showColorPicker, cancelSelection]);

  useEffect(() => {
    if (showColorPicker && labelInputRef.current) {
      setTimeout(() => labelInputRef.current?.focus(), 100);
    }
  }, [showColorPicker]);

  const handleHexChange = (value: string) => {
    let hex = value.startsWith("#") ? value : `#${value}`;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
      setCustomColor(hex.toUpperCase());
    }
  };

  // Cell size and spacing
  const cellSize = 14.5;
  const colGap = 2;
  const rowGap = 6; // Increased row gap for vertical elongation

  // Get hovered cell display info
  const getHoveredCellInfo = () => {
    if (!hoveredCell) return null;
    const [gridRowStr, yearStr] = hoveredCell.split('-');
    const gridRow = parseInt(gridRowStr);
    const year = parseInt(yearStr);
    const calendarMonth = getCalendarMonth(gridRow);
    const cellDate = getCellDate(gridRow, year);
    const customData = cellData[hoveredCell];
    
    return {
      text: `${MONTH_FULL_NAMES[calendarMonth]}${cellDate ? ` ${cellDate.getFullYear()}` : ''} (Age ${year})`,
      label: customData?.label,
      color: customData?.color,
    };
  };

  const hoveredInfo = getHoveredCellInfo();

  return (
    <div className="relative">
      {/* Grid Container */}
      <div ref={gridRef}>
        {/* Year labels (columns) */}
        <div className="flex mb-1 ml-8" style={{ gap: `${colGap}px` }}>
          {Array.from({ length: expectedLifeYears }, (_, i) => (
            <div
              key={i}
              className="text-xs text-gray-400 text-center"
              style={{ width: `${cellSize}px`, minWidth: `${cellSize}px` }}
            >
              {(i + 1) % 5 === 0 ? i + 1 : ""}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex">
          {/* Month labels (rows) - starting from birth month */}
          <div className="flex flex-col mr-1" style={{ gap: `${rowGap}px` }}>
            {orderedMonths.map((calendarMonth, gridRow) => (
              <div
                key={gridRow}
                className="text-xs text-gray-400 text-right pr-1 flex items-center justify-end cursor-default"
                style={{ height: `${cellSize}px`, minHeight: `${cellSize}px`, width: "28px" }}
                title={MONTH_FULL_NAMES[calendarMonth]}
              >
                {MONTH_NAMES[calendarMonth]}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div
            className="grid select-none"
            style={{
              gridTemplateColumns: `repeat(${expectedLifeYears}, ${cellSize}px)`,
              gridTemplateRows: `repeat(12, ${cellSize}px)`,
              columnGap: `${colGap}px`,
              rowGap: `${rowGap}px`,
            }}
          >
            {Array.from({ length: 12 }, (_, gridRow) =>
              Array.from({ length: expectedLifeYears }, (_, year) => {
                const key = getCellKey(gridRow, year);
                const monthIndex = year * 12 + gridRow;

                if (monthIndex >= totalMonths) return null;

                const isLived = monthIndex < monthsLived;
                const isCurrent = monthIndex === monthsLived;
                const isSelected = selectedCells.has(key);
                const customData = cellData[key];

                return (
                  <CircleCell
                    key={key}
                    isLived={isLived}
                    isCurrent={isCurrent}
                    isSelected={isSelected}
                    customColor={customData?.color}
                    progress={isCurrent ? currentMonthProgress || undefined : undefined}
                    onClick={() => handleCellClick(gridRow, year)}
                    onMouseEnter={() => handleMouseEnter(gridRow, year)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Hover info - below grid */}
      <div className="h-6 mt-2 flex items-center gap-2">
        {hoveredInfo && (
          <>
            {hoveredInfo.color && (
              <div
                className="w-3 h-3 rounded-full border border-gray-700 flex-shrink-0"
                style={{ backgroundColor: hoveredInfo.color }}
              />
            )}
            <span className="text-sm text-gray-700">
              {hoveredInfo.text}
              {hoveredInfo.label && (
                <span className="text-gray-900 font-medium"> — {hoveredInfo.label}</span>
              )}
            </span>
          </>
        )}
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && isEditable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold mb-3 text-gray-900">
              {selectedCells.size === 1 ? "Color this month" : `Color ${selectedCells.size} months`}
            </h3>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Label (optional)
              </label>
              <input
                ref={labelInputRef}
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                placeholder="e.g., College, First job..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Color
              </label>
              
              {/* Large color picker - click to open native picker */}
              <div className="flex items-start gap-4 mb-3">
                <div className="relative">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value.toUpperCase())}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="w-32 h-32 rounded-lg border-2 border-gray-300 cursor-pointer shadow-inner"
                    style={{ backgroundColor: customColor }}
                  />
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-white/80 px-1.5 py-0.5 rounded text-gray-600">
                    Click to pick
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">HEX:</span>
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => handleHexChange(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-gray-900 text-sm font-mono uppercase"
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Quick colors:</div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          customColor === color
                            ? "border-gray-800 scale-110"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setCustomColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={applyColor}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={clearSelectedCells}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
              >
                Clear
              </button>
              <button
                onClick={cancelSelection}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
            </div>

            {selectedCells.size === 1 && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                Or cancel and click another cell to select a range
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
