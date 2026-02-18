import { ReactNode } from 'react';

interface Column {
  label: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  children: ReactNode;
  loading?: boolean;
  skeletonRows?: number;
  skeletonCols?: number;
  emptyIcon?: ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
}

const DataTable = ({
  columns,
  children,
  loading = false,
  skeletonRows = 4,
  skeletonCols,
  emptyIcon,
  emptyText = 'No data found',
  isEmpty = false,
}: DataTableProps) => {
  const cols = skeletonCols ?? columns.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                  } ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array(skeletonRows)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(cols)
                      .fill(0)
                      .map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-6 bg-slate-100 rounded-lg w-3/4" />
                        </td>
                      ))}
                  </tr>
                ))
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    {emptyIcon && (
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        {emptyIcon}
                      </div>
                    )}
                    <span className="font-bold text-sm text-slate-400">{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
