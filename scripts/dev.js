#!/usr/bin/env node
const { spawn, execSync } = require('child_process');
const os = require('os');

const PORT = 3000;

function clearPort(port) {
  try {
    if (os.platform() === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      const lines = output.split('\n').filter((line) => line.includes('LISTENING'));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        }
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    }
  } catch {
    // No process on port or command failed - safe to continue
  }
}

clearPort(PORT);

function getLocalIP() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch {
    // Fall through to localhost
  }
  return 'localhost';
}

const SUPPRESS_PATTERNS = [
  'Local:',
  'Network:',
  'Starting',
  'Ready',
  '▲',
  '✓',
];

function shouldSuppress(line) {
  return SUPPRESS_PATTERNS.some((pattern) => line.includes(pattern));
}

const ip = getLocalIP();

console.log(`🌿 Floatgreens running at http://${ip}:${PORT}`);

const next = spawn(
  'node',
  ['node_modules/next/dist/bin/next', 'dev', '-H', ip, '-p', String(PORT)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['inherit', 'pipe', 'inherit'],
  }
);

next.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim() && !shouldSuppress(line)) {
      process.stdout.write(line + '\n');
    }
  }
});

next.on('close', (code) => {
  process.exit(code ?? 0);
});

next.on('error', (err) => {
  console.error('Failed to start Next.js:', err.message);
  process.exit(1);
});
