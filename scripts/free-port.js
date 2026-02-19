/**
 * Script to free port 8080 by killing any process using it
 * This prevents EADDRINUSE errors when starting the server
 */

const { exec } = require('child_process');
const os = require('os');

const PORT = 8080;

function freePort(port) {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows: Find process using the port and kill it
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log(`[free-port] Port ${port} is already free`);
          resolve();
          return;
        }

        // Extract PID from output
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            pids.add(pid);
          }
        }

        if (pids.size === 0) {
          console.log(`[free-port] Port ${port} is already free`);
          resolve();
          return;
        }

        console.log(`[free-port] Found ${pids.size} process(es) using port ${port}, killing...`);
        
        // Kill all processes using the port
        const killPromises = Array.from(pids).map(pid => {
          return new Promise((killResolve) => {
            exec(`taskkill /PID ${pid} /F`, (killError) => {
              if (killError) {
                console.log(`[free-port] Warning: Could not kill process ${pid} (may already be terminated)`);
              } else {
                console.log(`[free-port] Killed process ${pid}`);
              }
              killResolve();
            });
          });
        });

        Promise.all(killPromises).then(() => {
          console.log(`[free-port] Port ${port} is now free`);
          resolve();
        });
      });
    } else {
      // Unix/Linux/Mac: Use lsof to find and kill process
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log(`[free-port] Port ${port} is already free`);
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n').filter(Boolean);
        console.log(`[free-port] Found ${pids.length} process(es) using port ${port}, killing...`);

        const killPromises = pids.map(pid => {
          return new Promise((killResolve) => {
            exec(`kill -9 ${pid}`, (killError) => {
              if (killError) {
                console.log(`[free-port] Warning: Could not kill process ${pid}`);
              } else {
                console.log(`[free-port] Killed process ${pid}`);
              }
              killResolve();
            });
          });
        });

        Promise.all(killPromises).then(() => {
          console.log(`[free-port] Port ${port} is now free`);
          resolve();
        });
      });
    }
  });
}

// Run if called directly
if (require.main === module) {
  freePort(PORT)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(`[free-port] Error:`, error);
      process.exit(1);
    });
}

module.exports = { freePort };
