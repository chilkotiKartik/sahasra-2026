import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// On Windows, the pathname can start with /C:/..., let's normalize it
const rootDir = path.resolve(process.cwd());
const deployDir = path.join(rootDir, 'deploy');

console.log('Preparing deployment directory...');

// 1. Clean deploy directory
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

// 2. Ensure build/ and web/dist/ exist
const buildDir = path.join(rootDir, 'build');
const webDistDir = path.join(rootDir, 'web', 'dist');

if (!fs.existsSync(buildDir)) {
  console.error('Error: build/ directory not found. Please run "npm run server:build" first.');
  process.exit(1);
}
if (!fs.existsSync(webDistDir)) {
  console.error('Error: web/dist/ directory not found. Please run "npm run build" inside web/ first.');
  process.exit(1);
}

// 3. Copy build/ to deploy/build/
fs.mkdirSync(path.join(deployDir, 'build'), { recursive: true });
fs.cpSync(buildDir, path.join(deployDir, 'build'), { recursive: true });
console.log('Copied server build files.');

// 4. Copy web/dist/ to deploy/web/dist/
fs.mkdirSync(path.join(deployDir, 'web', 'dist'), { recursive: true });
fs.cpSync(webDistDir, path.join(deployDir, 'web', 'dist'), { recursive: true });
console.log('Copied web portal build files.');

// 5. Copy app-config.json to deploy/app-config.json
// But let's change build_command in deploy/app-config.json to just npm install
const appConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'app-config.json'), 'utf8'));
appConfig.build_command = 'npm install --omit=dev';
fs.writeFileSync(path.join(deployDir, 'app-config.json'), JSON.stringify(appConfig, null, 2));
console.log('Created deploy/app-config.json.');

// 6. Write pruned package.json to deploy/package.json
const rootPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const prunedPackage = {
  name: 'sahasra-api',
  version: '1.0.0',
  type: 'module',
  scripts: {
    'catalyst:start': 'NODE_ENV=production node build/index.mjs'
  },
  dependencies: {
    '@simplewebauthn/server': rootPackage.dependencies['@simplewebauthn/server'] || '^10.0.1',
    'bcryptjs': rootPackage.dependencies['bcryptjs'] || '^2.4.3',
    'drizzle-orm': rootPackage.dependencies['drizzle-orm'] || '^0.39.3',
    'express': rootPackage.dependencies['express'] || '^5.2.1',
    'haversine-distance': rootPackage.dependencies['haversine-distance'] || '^1.2.4',
    'jsonwebtoken': rootPackage.dependencies['jsonwebtoken'] || '^9.0.3',
    'pg': rootPackage.dependencies['pg'] || '^8.20.0',
    'ws': rootPackage.dependencies['ws'] || '^8.20.0',
    'zod': rootPackage.dependencies['zod'] || '^3.25.76',
    'zod-validation-error': rootPackage.dependencies['zod-validation-error'] || '^3.5.4'
  }
};
fs.writeFileSync(path.join(deployDir, 'package.json'), JSON.stringify(prunedPackage, null, 2));
console.log('Created deploy/package.json with production-only dependencies.');

console.log('Deployment preparation complete! Your deployable package is ready in the "deploy/" folder.');
