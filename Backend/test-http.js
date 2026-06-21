import http from 'http';

// Make a real HTTP request to the running backend
function makeRequest(path, method = 'GET', body = null, token = '') {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`,
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// First login to get a token
const loginRes = await makeRequest('/api/auth/login', 'POST', {
  email: 'hassanmansoor9@gmail.com',
  password: '12345678'
});

console.log('Login status:', loginRes.status);
if (loginRes.status !== 200) {
  console.error('Login failed:', loginRes.body);
  process.exit(1);
}

const token = loginRes.body.token;
console.log('Got token:', token ? token.slice(0, 30) + '...' : 'NONE');

// Now test the AI endpoint
const aiRes = await makeRequest('/api/ai/get-result?prompt=Hello', 'GET', null, token);
console.log('\nAI Chat status:', aiRes.status);
console.log('AI Chat response:', JSON.stringify(aiRes.body, null, 2).slice(0, 500));

// Test analyze-code endpoint
const analyzeRes = await makeRequest('/api/ai/analyze-code', 'POST', {
  code: 'function add(a, b) { return a + b; }',
  filename: 'test.js',
  language: 'javascript'
}, token);
console.log('\nAnalyze Code status:', analyzeRes.status);
console.log('Analyze Code response:', JSON.stringify(analyzeRes.body, null, 2).slice(0, 300));
