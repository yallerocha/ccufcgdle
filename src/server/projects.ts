import { prisma } from './db';
import { DEFAULT_PROJECT_NAMES, normalizeProjectName, PROJECT_OTHER_NAME } from '../shared/validation';

export interface ProjectWithCount {
  id: string;
  name: string;
  memberCount: number;
}

export async function getAllowedProjectNames(): Promise<Set<string>> {
  const rows = await prisma.project.findMany({ select: { name: true } });
  return new Set(rows.map((r) => r.name));
}

export async function listProjectsWithCounts(): Promise<ProjectWithCount[]> {
  const [catalog, users] = await Promise.all([
    prisma.project.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { isActive: true, emailVerifiedAt: { not: null } }, select: { projects: true } }),
  ]);

  const counts = new Map<string, number>();
  for (const user of users) {
    for (const project of user.projects) {
      counts.set(project, (counts.get(project) ?? 0) + 1);
    }
  }

  return catalog.map((p) => ({
    id: p.id,
    name: p.name,
    memberCount: counts.get(p.name) ?? 0,
  }));
}

export async function createProject(
  rawName: string,
  createdById: string
): Promise<{ project: { id: string; name: string }; created: boolean } | { error: string }> {
  const normalized = normalizeProjectName(rawName);
  if (!normalized) {
    return { error: 'Nome de projeto inválido (use entre 2 e 60 caracteres).' };
  }

  const existing = await prisma.project.findFirst({
    where: { name: { equals: normalized, mode: 'insensitive' } },
  });
  if (existing) {
    return { project: { id: existing.id, name: existing.name }, created: false };
  }

  const project = await prisma.project.create({
    data: { name: normalized, createdById },
    select: { id: true, name: true },
  });
  return { project, created: true };
}

/** Removes a project from the catalog. Users on that project are moved to "Outro". */
export async function deleteProject(projectId: string): Promise<{ ok: true; reassigned: number } | { error: string }> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return { error: 'Projeto não encontrado.' };
  }
  if (project.name === PROJECT_OTHER_NAME) {
    return { error: 'O projeto "Outro" não pode ser removido.' };
  }

  let reassigned = 0;
  await prisma.$transaction(async (tx) => {
    const usersWithProject = await tx.user.findMany({
      where: { projects: { has: project.name } },
      select: { id: true },
    });
    reassigned = usersWithProject.length;

    for (const user of usersWithProject) {
      await tx.user.update({
        where: { id: user.id },
        data: { projects: [PROJECT_OTHER_NAME] },
      });
    }

    await tx.project.delete({ where: { id: projectId } });
  });

  return { ok: true, reassigned };
}

/** Seeds the default catalog; safe to call on every deploy/seed. */
export async function ensureDefaultProjects(): Promise<void> {
  for (const name of DEFAULT_PROJECT_NAMES) {
    await prisma.project.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}

/** Ensures every project name referenced by users exists in the catalog. */
export async function syncProjectsFromUsers(): Promise<void> {
  const users = await prisma.user.findMany({ select: { projects: true } });
  const names = new Set<string>();
  for (const user of users) {
    for (const project of user.projects) {
      names.add(project);
    }
  }
  for (const name of names) {
    await prisma.project.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}
