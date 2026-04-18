import http from 'http';

const data = JSON.stringify({ email: 'admin@barbershop.com', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res: http.IncomingMessage) => {
  let responseData = '';
  res.on('data', (chunk: Buffer) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Data:', responseData);
  });
});

req.on('error', (error: Error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
