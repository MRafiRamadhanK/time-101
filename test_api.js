import http from 'http';

const postData = JSON.stringify({ gender: 'cewe' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/child',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-device-id': 'dc29c2da-f01a-457e-b530-dc243309acb8',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
