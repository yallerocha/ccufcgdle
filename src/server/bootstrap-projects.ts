import { prisma } from './db.js';
import { bootstrapProjectCatalog } from './projects.js';

bootstrapProjectCatalog()
  .then((count) => {
    console.log(`[projects] Catalog ready (${count} entries).`);
  })
  .catch((err) => {
    console.error('[projects] Failed to bootstrap project catalog:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
