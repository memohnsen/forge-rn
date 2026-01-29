import { createClerkSupabaseClient } from '@/services/supabase';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { trackDataExported, trackHistoryExported } from '@/utils/analytics';

interface CSVExportOptions {
  userId: string;
  getToken: () => Promise<string | null>;
}

type CSVResult = {
  csv: string;
  count: number;
};

// Helper function to escape CSV values
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

// Convert array of objects to CSV string
function convertToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => escapeCSV(row[header]));
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

async function fetchCheckInsCSV(userId: string, supabase: any): Promise<CSVResult> {
  try {
    const { data, error } = await supabase
      .from('journal_daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('check_in_date', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { csv: 'No daily check-ins data available\n', count: 0 };
    }

    const headers = [
      'check_in_date',
      'selected_lift',
      'selected_intensity',
      'goal',
      'physical_strength',
      'mental_strength',
      'recovered',
      'confidence',
      'sleep',
      'energy',
      'stress',
      'soreness',
      'readiness',
      'focus',
      'excitement',
      'body_connection',
      'concerns',
      'physical_score',
      'mental_score',
      'overall_score',
      'created_at'
    ];

    return { csv: convertToCSV(data, headers), count: data.length };
  } catch (error) {
    console.error('Error fetching check-ins CSV:', error);
    return { csv: 'Error fetching daily check-ins data\n', count: 0 };
  }
}

async function fetchSessionReportsCSV(userId: string, supabase: any): Promise<CSVResult> {
  try {
    const { data, error } = await supabase
      .from('journal_session_report')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { csv: 'No session reports data available\n', count: 0 };
    }

    const headers = [
      'session_date',
      'time_of_day',
      'session_rpe',
      'movement_quality',
      'focus',
      'misses',
      'cues',
      'feeling',
      'satisfaction',
      'confidence',
      'what_learned',
      'what_would_change',
      'selected_lift',
      'selected_intensity',
      'created_at'
    ];

    return { csv: convertToCSV(data, headers), count: data.length };
  } catch (error) {
    console.error('Error fetching session reports CSV:', error);
    return { csv: 'Error fetching session reports data\n', count: 0 };
  }
}

async function fetchCompReportsCSV(userId: string, supabase: any): Promise<CSVResult> {
  try {
    const { data, error } = await supabase
      .from('journal_comp_report')
      .select('*')
      .eq('user_id', userId)
      .order('meet_date', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { csv: 'No competition reports data available\n', count: 0 };
    }

    const headers = [
      'meet_date',
      'meet',
      'selected_meet_type',
      'bodyweight',
      'performance_rating',
      'physical_preparedness_rating',
      'mental_preparedness_rating',
      'nutrition',
      'hydration',
      'did_well',
      'needs_work',
      'good_from_training',
      'cues',
      'focus',
      'satisfaction',
      'confidence',
      'pressure_handling',
      'what_learned',
      'what_proud_of',
      'snatch1',
      'snatch2',
      'snatch3',
      'cj1',
      'cj2',
      'cj3',
      'snatch_best',
      'cj_best',
      'squat1',
      'squat2',
      'squat3',
      'bench1',
      'bench2',
      'bench3',
      'deadlift1',
      'deadlift2',
      'deadlift3',
      'squat_best',
      'bench_best',
      'deadlift_best',
      'created_at'
    ];

    return { csv: convertToCSV(data, headers), count: data.length };
  } catch (error) {
    console.error('Error fetching competition reports CSV:', error);
    return { csv: 'Error fetching competition reports data\n', count: 0 };
  }
}

export async function createAndShareCSV({ userId, getToken }: CSVExportOptions): Promise<boolean> {
  try {
    // Create Supabase client
    const supabase = createClerkSupabaseClient(getToken);

    // Fetch all data
    const [checkInsResult, sessionReportsResult, compReportsResult] = await Promise.all([
      fetchCheckInsCSV(userId, supabase),
      fetchSessionReportsCSV(userId, supabase),
      fetchCompReportsCSV(userId, supabase)
    ]);

    // Combine all CSV data with section headers
    // Use single quote prefix to prevent formula interpretation in spreadsheet apps
    let combinedCSV = "DAILY CHECK-INS\n";
    combinedCSV += checkInsResult.csv;
    combinedCSV += "\n\nSESSION REPORTS\n";
    combinedCSV += sessionReportsResult.csv;
    combinedCSV += "\n\nCOMPETITION REPORTS\n";
    combinedCSV += compReportsResult.csv;

    // Create filename with current date
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const filename = `Forge_Export_${dateString}.csv`;

    // Create file using new expo-file-system API
    const file = new File(Paths.cache, filename);
    await file.write(combinedCSV);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
      console.error('Sharing is not available on this device');
      return false;
    }

    // Share the file
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Forge Data',
      UTI: 'public.comma-separated-values-text'
    });

    const totalCount =
      checkInsResult.count + sessionReportsResult.count + compReportsResult.count;
    trackHistoryExported('csv', totalCount);
    trackDataExported('csv');

    return true;
  } catch (error) {
    console.error('Error creating and sharing CSV:', error);
    return false;
  }
}
