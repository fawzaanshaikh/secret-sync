import { useEffect, useState } from 'react';
import { listAuditLog } from '../lib/api-stubs';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AuditLogTab({ project }) {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    listAuditLog(project.id).then(setEntries);
  }, [project.id]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-bg-panel text-xs uppercase tracking-wide text-text-dim">
            <th className="px-4 py-2 font-medium">Timestamp</th>
            <th className="px-4 py-2 font-medium">Actor</th>
            <th className="px-4 py-2 font-medium">Action</th>
            <th className="px-4 py-2 font-medium">Resource</th>
            <th className="px-4 py-2 font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          {entries === null && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-text-dim">
                Loading audit log…
              </td>
            </tr>
          )}
          {entries &&
            entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-b-0">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-text-dim">
                  {formatTimestamp(entry.timestamp)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-sm text-text-bright">{entry.actorName}</div>
                  <div className="font-mono text-xs text-text-dim">{entry.actorEmail}</div>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-accent">{entry.action}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-text">{entry.resource}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-text-dim">{entry.ip}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
