import { Link } from "react-router-dom";

export default function DataTable({ columns, rows, rowKey }) {
  if (!rows?.length) return null;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-3 py-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[rowKey]} className="border-b border-border/70">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-3 align-middle text-white">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article key={row[rowKey]} className="rounded-2xl border border-border bg-card-elevated p-4">
            {columns.map((column) => (
              <div key={column.key} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                <span className="text-text-muted">{column.label}</span>
                <span className="text-right text-white">{column.render ? column.render(row) : row[column.key]}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}

export function ViewLink({ to, children = "View" }) {
  return (
    <Link to={to} className="font-semibold text-pink hover:text-white">
      {children}
    </Link>
  );
}
