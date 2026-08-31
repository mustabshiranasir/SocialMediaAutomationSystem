// Table Component — Reusable data table with sorting, striping, and empty state
import React from "react";
import { motion } from "framer-motion";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  emptyIcon?: string;
  striped?: boolean;
  hoverable?: boolean;
  animate?: boolean;
  className?: string;
  caption?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available",
  emptyIcon = "📭",
  striped = true,
  hoverable = true,
  animate = true,
  className = "",
  caption,
}: TableProps<T>) {
  const getValue = (row: T, key: keyof T | string): any => {
    return (row as any)[key as string];
  };

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    : {};

  return (
    <Wrapper {...(wrapperProps as any)} className={`w-full overflow-x-auto rounded-xl border border-slate-200 ${className}`}>
      <table className="w-full text-sm border-collapse">
        {caption && (
          <caption className="text-xs text-slate-500 text-left px-4 pt-3 pb-1 font-medium">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`
                  px-4 py-3 text-left text-xs font-semibold text-slate-500
                  uppercase tracking-wider whitespace-nowrap
                  ${col.headerClassName ?? ""}
                `}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                  <span className="text-4xl opacity-50">{emptyIcon}</span>
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row, rowIndex)}
                className={`
                  transition-colors
                  ${striped && rowIndex % 2 === 1 ? "bg-slate-50/60" : "bg-white"}
                  ${hoverable ? "hover:bg-blue-50/40" : ""}
                `}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-3 text-slate-700 ${col.className ?? ""}`}
                  >
                    {col.render
                      ? col.render(getValue(row, col.key), row, rowIndex)
                      : String(getValue(row, col.key) ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Wrapper>
  );
}
