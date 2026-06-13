import { existsSync } from 'fs';
import { execSync } from 'child_process';

if (existsSync('prisma/schema.prisma')) {
  execSync('npx prisma generate', { stdio: 'inherit' });
}
