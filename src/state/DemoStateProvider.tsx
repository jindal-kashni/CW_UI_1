import React, { createContext, useContext, useMemo, useState } from 'react';
import type { AlertItem, AuditAssignment, SyncItem } from '@/src/types/models';
import { alerts as seedAlerts, auditAssignments as seedAssignments, syncItems as seedSync } from '@/src/data';
import { fetchAuditorAlerts } from '@/src/services/systemData';

type DemoState = {
  assignments: AuditAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<AuditAssignment[]>>;
  alerts: AlertItem[];
  setAlerts: React.Dispatch<React.SetStateAction<AlertItem[]>>;
  markAlertRead: (id: string) => void;
  completeAlert: (id: string) => void;
  sync: SyncItem[];
  setSync: React.Dispatch<React.SetStateAction<SyncItem[]>>;
};

const Ctx = createContext<DemoState | null>(null);

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [assignments, setAssignments] = useState<AuditAssignment[]>(seedAssignments);
  const [alerts, setAlerts] = useState<AlertItem[]>(seedAlerts);
  const [sync, setSync] = useState<SyncItem[]>(seedSync);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await fetchAuditorAlerts();
      if (mounted && rows.length > 0) {
        setAlerts(rows);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const markAlertRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const completeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, read: true, completedAt: a.completedAt ?? new Date().toISOString() }
          : a
      )
    );
  };

  const value = useMemo(
    () => ({
      assignments,
      setAssignments,
      alerts,
      setAlerts,
      markAlertRead,
      completeAlert,
      sync,
      setSync,
    }),
    [assignments, alerts, sync]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoState() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDemoState must be used within DemoStateProvider');
  return v;
}

