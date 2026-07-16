import { prisma } from './db';

// Admin-tunable runtime settings, stored in AppSetting (key/value). Each getter
// falls back to a default so an absent row preserves the historical behavior.

// When true (default), players who haven't logged in for INACTIVITY_DAYS are
// hidden from the games (guesses + daily draw). When false, every active,
// email-verified member with a complete profile participates regardless of the
// last login date. Non-destructive: no account is ever deleted either way.
const INACTIVITY_EXCLUSION_KEY = 'inactivityExclusionEnabled';

export async function isInactivityExclusionEnabled(): Promise<boolean> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: INACTIVITY_EXCLUSION_KEY } });
    return row ? row.value === 'true' : true; // default: enabled (current behavior)
  } catch {
    // If the settings table isn't reachable, fail safe to the historical default.
    return true;
  }
}

export async function setInactivityExclusionEnabled(enabled: boolean): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: INACTIVITY_EXCLUSION_KEY },
    create: { key: INACTIVITY_EXCLUSION_KEY, value: String(enabled) },
    update: { value: String(enabled) },
  });
}
