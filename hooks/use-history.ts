import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { CheckIn } from '@/models/CheckIn';
import { SessionReport } from '@/models/Session';
import { CompReport } from '@/models/Competition';

export type HistoryFilter = 'Check-Ins' | 'Workouts' | 'Meets';

interface UseHistoryReturn {
  checkIns: CheckIn[];
  sessionReports: SessionReport[];
  compReports: CompReport[];
  isLoading: boolean;
  error: Error | null;
  selectedFilter: HistoryFilter;
  setSelectedFilter: (filter: HistoryFilter) => void;
  refresh: () => Promise<void>;
}

interface UseHistoryDetailsReturn {
  checkIn: CheckIn | null;
  session: SessionReport | null;
  comp: CompReport | null;
  isLoading: boolean;
  error: Error | null;
  deleteItem: () => Promise<boolean>;
}

export function useHistory(): UseHistoryReturn {
  const { userId } = useAuth();

  const convexCheckIns = useQuery(api.dailyCheckIns.listByUser, userId ? { userId } : 'skip');
  const convexSessions = useQuery(api.sessionReports.listByUser, userId ? { userId } : 'skip');
  const convexComps = useQuery(api.compReports.listByUser, userId ? { userId } : 'skip');

  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>('Check-Ins');

  const isLoading =
    convexCheckIns === undefined ||
    convexSessions === undefined ||
    convexComps === undefined;

  const checkIns = (convexCheckIns as CheckIn[] | undefined) ?? [];
  const sessionReports = (convexSessions as SessionReport[] | undefined) ?? [];
  const compReports = (convexComps as CompReport[] | undefined) ?? [];

  // Convex is reactive — refresh is a no-op
  const refresh = useCallback(async () => {}, []);

  return {
    checkIns,
    sessionReports,
    compReports,
    isLoading,
    error: null,
    selectedFilter,
    setSelectedFilter,
    refresh,
  };
}

export function useHistoryDetails(
  type: HistoryFilter,
  id: string // Convex document _id string
): UseHistoryDetailsReturn {
  const { userId } = useAuth();

  const convexCheckIn = useQuery(
    api.dailyCheckIns.getById,
    type === 'Check-Ins' && id ? { id: id as Id<'dailyCheckIns'> } : 'skip'
  );
  const convexSession = useQuery(
    api.sessionReports.getById,
    type === 'Workouts' && id ? { id: id as Id<'sessionReports'> } : 'skip'
  );
  const convexComp = useQuery(
    api.compReports.getById,
    type === 'Meets' && id ? { id: id as Id<'compReports'> } : 'skip'
  );

  const deleteCheckIn = useMutation(api.dailyCheckIns.deleteById);
  const deleteSession = useMutation(api.sessionReports.deleteById);
  const deleteComp = useMutation(api.compReports.deleteById);

  const [error, setError] = useState<Error | null>(null);

  const isLoading =
    (type === 'Check-Ins' && convexCheckIn === undefined) ||
    (type === 'Workouts' && convexSession === undefined) ||
    (type === 'Meets' && convexComp === undefined);

  // Verify ownership before returning
  const checkIn =
    convexCheckIn && convexCheckIn.userId === userId ? (convexCheckIn as CheckIn) : null;
  const session =
    convexSession && convexSession.userId === userId ? (convexSession as SessionReport) : null;
  const comp =
    convexComp && convexComp.userId === userId ? (convexComp as CompReport) : null;

  const deleteItem = useCallback(async (): Promise<boolean> => {
    try {
      if (type === 'Check-Ins' && id) {
        await deleteCheckIn({ id: id as Id<'dailyCheckIns'> });
      } else if (type === 'Workouts' && id) {
        await deleteSession({ id: id as Id<'sessionReports'> });
      } else if (type === 'Meets' && id) {
        await deleteComp({ id: id as Id<'compReports'> });
      }
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err as Error);
      return false;
    }
  }, [type, id, deleteCheckIn, deleteSession, deleteComp]);

  return {
    checkIn,
    session,
    comp,
    isLoading,
    error,
    deleteItem,
  };
}

export function getScoreColor(score: number, type: HistoryFilter): string {
  if (type === 'Check-Ins') {
    if (score >= 80) return '#5AB48C';
    if (score >= 60) return '#FFB450';
    return '#DC6464';
  } else if (type === 'Workouts') {
    if (score <= 2) return '#5AB48C';
    if (score <= 3) return '#FFB450';
    return '#DC6464';
  }
  return '#5386E4';
}

export function getAccentColor(type: HistoryFilter): string {
  switch (type) {
    case 'Meets': return '#FFD700';
    case 'Workouts': return '#5386E4';
    default: return '#5AB48C';
  }
}
