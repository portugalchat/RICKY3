import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Sustain 100 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '5m', target: 500 }, // Sustain 500 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '5m', target: 1000 }, // Sustain 1000 users
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Test health endpoint
  let healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Test user registration
  let registerPayload = JSON.stringify({
    email: `user${__VU}${__ITER}@test.com`,
    username: `user${__VU}${__ITER}`,
    password: 'password123',
    name: `Test User ${__VU}`,
    age: 25,
    gender: 'male',
    preferredGender: 'both'
  });

  let registerResponse = http.post(`${BASE_URL}/api/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(registerResponse, {
    'registration status is 200 or 400': (r) => r.status === 200 || r.status === 400,
  });

  // Test WebSocket connection
  let wsUrl = BASE_URL.replace('http', 'ws') + '/ws';
  
  let response = ws.connect(wsUrl, {}, function (socket) {
    socket.on('open', function open() {
      console.log('WebSocket connection opened');
      socket.send(JSON.stringify({
        type: 'authenticate',
        userId: __VU
      }));
    });

    socket.on('message', function (message) {
      console.log('Received message:', message);
    });

    socket.setTimeout(function () {
      socket.close();
    }, 5000);
  });

  check(response, {
    'websocket status is 101': (r) => r && r.status === 101,
  });

  sleep(1);
}