type DevSubStatus = boolean | null;

const parseDevSubStatus = (value: string | undefined): DevSubStatus => {
  if (value == null) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
};

const devSubStatus = parseDevSubStatus(process.env.EXPO_PUBLIC_DEV_SUB_STATUS);

export const devConfig = {
  subStatusOverride: __DEV__ ? devSubStatus : null,
};

