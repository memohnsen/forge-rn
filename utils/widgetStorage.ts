import { Platform } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';

const APP_GROUP_ID = 'group.com.memohnsen.forge.JournalWidget';
const WIDGET_KIND = 'JournalWidget';

const storage = Platform.OS === 'ios' ? new ExtensionStorage(APP_GROUP_ID) : null;

export type JournalWidgetPayload = {
  meetName: string;
  meetDate: string;
  trainingDaysPerWeek: number;
};

export async function updateJournalWidget(data: JournalWidgetPayload) {
  if (!storage) return;

  try {
    storage.set('meetName', data.meetName);
    storage.set('meetDate', data.meetDate);
    storage.set('trainingDaysPerWeek', data.trainingDaysPerWeek);
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch (error) {
    console.warn('[widgetStorage] Failed to update widget data', error);
  }
}

export async function clearJournalWidget() {
  if (!storage) return;

  try {
    storage.set('meetName', undefined);
    storage.set('meetDate', undefined);
    storage.set('trainingDaysPerWeek', undefined);
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch (error) {
    console.warn('[widgetStorage] Failed to clear widget data', error);
  }
}
