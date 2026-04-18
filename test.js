const { spawn } = require('child_process');
const http = require('http');

const server = spawn('npx', ['-y', 'tsx', 'server.ts']);

server.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
  if (data.toString().includes('Ready on')) {
    http.get('http://localhost:8082/', (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      server.kill();
    });
  }
});

server.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

setTimeout(() => {
  server.kill();
}, 10000);
