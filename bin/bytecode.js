#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const { spawn } = require('child_process');
const pkg = require('../package.json');

const program = new Command();

program
  .name('bytecode-c2')
  .description('ByteCode Tactical C2 CLI')
  .version(pkg.version);

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function glitchIntro() {
  const frames = [
    '█▓▒░ BYTEC0D3 ░▒▓█',
    '▓▒░ B¥TΞC0DΞ ░▒▓',
    '▒░ B?T#C0@E ░▒',
    '░ B T E C O D E ░',
    '  BYTECODE  ',
  ];

  const subFrames = [
    '[ TACTICAL // C2 ]',
    '[ TACT1CAL // C2 ]',
    '[ TACTICAL // C? ]',
    '[ TACTICAL // C2 ]',
  ];

  // Clear screen for cleaner effect
  process.stdout.write('\x1b[2J\x1b[0f');

  // Glitch phase
  for (let i = 0; i < frames.length; i++) {
    process.stdout.write('\x1b[36m'); // cyan
    process.stdout.write(`\r${frames[i].padStart(40)}\n`);
    process.stdout.write(`\r${subFrames[i % subFrames.length].padStart(40)}\n`);
    process.stdout.write('\x1b[0m');
    await sleep(120);
    process.stdout.write('\x1b[2A'); // move cursor up 2 lines
  }

  // Resolve into final clean banner
  process.stdout.write('\x1b[36m');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║          BYTECODE SYSTEM            ║');
  console.log('  ║     TACTICAL COMMAND INTERFACE      ║');
  console.log('  ╚══════════════════════════════════════╝');
  process.stdout.write('\x1b[0m');

  // Subtle system line
  console.log('\x1b[90m  [SYS] Signal stabilized...\x1b[0m\n');
}

program
  .command('start')
  .description('Start the ByteCode C2 Server and Dashboard')
  .option('-p, --port <number>', 'Port to run the server on', '3001')
  .action(async (options) => {
    await glitchIntro();

    console.log('  \x1b[1m\x1b[32m[+]\x1b[0m Initializing Tactical C2 Infrastructure...');
    console.log('  \x1b[36m[+]\x1b[0m Traffic Encryption:  AES-256-GCM ACTIVE');
    console.log('  \x1b[36m[+]\x1b[0m Operational Masking: ENABLED');

    const serverPath = path.join(__dirname, '../server/src/index.js');
    const distPath = path.join(__dirname, '../dashboard/dist');
    const env = { ...process.env, PORT: options.port };

    // Check if dashboard needs building
    const fs = require('fs');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      const dashboardDir = path.join(__dirname, '../dashboard');
      const vitePath = path.join(dashboardDir, 'node_modules', 'vite', 'bin', 'vite.js');

      if (fs.existsSync(vitePath)) {
        // Source install — dashboard source + deps available, build with vite directly
        console.log('  \x1b[33m[!]\x1b[0m Dashboard build missing. Initiating build sequence...');
        try {
          const buildProcess = spawn(process.execPath, [vitePath, 'build'], {
            cwd: dashboardDir,
            stdio: 'inherit'
          });

          await new Promise((resolve, reject) => {
            buildProcess.on('close', (code) => {
              if (code === 0) resolve();
              else reject(new Error(`Build failed with code ${code}`));
            });
          });
          console.log('  \x1b[32m[+]\x1b[0m Dashboard build completed successfully.\n');
        } catch (err) {
          console.log('  \x1b[31m[!]\x1b[0m Dashboard build failed. Server will run in API-only mode.');
        }
      } else {
        console.log('  \x1b[31m[!]\x1b[0m Dashboard assets not found. Server will run in API-only mode.');
        console.log('  \x1b[90m    Run from project source with dashboard dependencies installed to enable the UI.\x1b[0m');
      }
    }

    const server = spawn('node', [serverPath], {
      stdio: 'inherit',
      env
    });

    server.on('close', (code) => {
      console.log(`\n  🛑 Server exited with code ${code}`);
    });

    process.on('SIGINT', () => {
      console.log('\n  👋 Shutting down...');
      server.kill();
      process.exit();
    });
  });

program.parse();
