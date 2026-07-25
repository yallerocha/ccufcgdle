import { prisma } from './db';

// Admins can retire a question without touching the bank: the disabled ids live
// in a single AppSetting row (csv) and are excluded when a run picks its ladder.
// Nothing is deleted — re-enabling puts the question straight back in rotation.
const KEY = 'disabledQuestions';

export async function getDisabledIds(): Promise<Set<string>> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
  return new Set(row?.value ? row.value.split(',').filter(Boolean) : []);
}

export async function setQuestionDisabled(id: string, disabled: boolean): Promise<Set<string>> {
  const ids = await getDisabledIds();
  if (disabled) ids.add(id);
  else ids.delete(id);
  const value = [...ids].join(',');
  await prisma.appSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value },
    update: { value },
  });
  return ids;
}
