import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { trackDataExported, trackHistoryExported } from '@/utils/analytics';
import { convexClient } from '@/app/_layout';
import { api } from '@/convex/_generated/api';

interface CSVExportOptions {
  userId: string;
  getToken?: () => Promise<string | null>;
}

// Helper function to escape CSV values
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

// Convert array of objects to CSV string with explicit headers
function convertToCSV(data: Record<string, unknown>[], headers: string[]): string {
  const csvRows: string[] = [headers.join(',')];
  for (const row of data) {
    const values = headers.map((header) => escapeCSV(row[header]));
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

const CHECK_IN_HEADERS = [
  'checkInDate', 'selectedLift', 'selectedIntensity', 'goal',
  'physicalStrength', 'mentalStrength', 'recovered', 'confidence',
  'sleep', 'energy', 'stress', 'soreness', 'readiness', 'focus',
  'excitement', 'bodyConnection', 'concerns', 'physicalScore', 'mentalScore', 'overallScore',
];

const SESSION_HEADERS = [
  'sessionDate', 'timeOfDay', 'sessionRpe', 'movementQuality',
  'focus', 'misses', 'cues', 'feeling', 'satisfaction', 'confidence',
  'whatLearned', 'whatWouldChange', 'selectedLift', 'selectedIntensity',
];

const COMP_HEADERS = [
  'meetDate', 'meet', 'selectedMeetType', 'bodyweight',
  'performanceRating', 'physicalPreparednessRating', 'mentalPreparednessRating',
  'nutrition', 'hydration', 'didWell', 'needsWork', 'goodFromTraining',
  'cues', 'focus', 'satisfaction', 'confidence', 'pressureHandling',
  'whatLearned', 'whatProudOf', 'snatchBest', 'cjBest',
  'squatBest', 'benchBest', 'deadliftBest',
];

export async function createAndShareCSV({ userId }: CSVExportOptions): Promise<boolean> {
  try {
    const { checkIns, sessionReports, compReports } = await convexClient.action(
      api.actions.exportData.fetchAllForExport,
      { userId }
    );

    const checkInsCSV =
      checkIns.length > 0
        ? convertToCSV(checkIns as Record<string, unknown>[], CHECK_IN_HEADERS)
        : 'No daily check-ins data available';

    const sessionCSV =
      sessionReports.length > 0
        ? convertToCSV(sessionReports as Record<string, unknown>[], SESSION_HEADERS)
        : 'No session reports data available';

    const compCSV =
      compReports.length > 0
        ? convertToCSV(compReports as Record<string, unknown>[], COMP_HEADERS)
        : 'No competition reports data available';

    let combinedCSV = 'DAILY CHECK-INS\n';
    combinedCSV += checkInsCSV;
    combinedCSV += '\n\nSESSION REPORTS\n';
    combinedCSV += sessionCSV;
    combinedCSV += '\n\nCOMPETITION REPORTS\n';
    combinedCSV += compCSV;

    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const filename = `Forge_Export_${dateString}.csv`;

    const file = new File(Paths.cache, filename);
    await file.write(combinedCSV);

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error('Sharing is not available on this device');
      return false;
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Forge Data',
      UTI: 'public.comma-separated-values-text',
    });

    const totalCount = checkIns.length + sessionReports.length + compReports.length;
    trackHistoryExported('csv', totalCount);
    trackDataExported('csv');

    return true;
  } catch (error) {
    console.error('Error creating and sharing CSV:', error);
    return false;
  }
}
