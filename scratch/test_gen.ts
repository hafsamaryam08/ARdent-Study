import axios from 'axios';

async function test() {
  const baseUrl = 'http://localhost:5000';
  const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
    username: 'testuser_215957',
    password: 'Password123!'
  });
  
  const cookie = loginRes.headers['set-cookie'];
  console.log('Logged in. Cookie:', cookie);
  
  const conceptsRes = await axios.get(`${baseUrl}/api/ar/models`, {
    headers: { Cookie: cookie }
  });
  
  const concept = conceptsRes.data[0];
  console.log('Triggering generation for:', concept.title, '(', concept.id, ')');
  
  try {
    const genRes = await axios.post(`${baseUrl}/api/ar/generate/${concept.id}`, {}, {
      headers: { Cookie: cookie }
    });
    console.log('Response:', genRes.data);
  } catch (e: any) {
    console.error('Error:', e.response?.data || e.message);
  }
}

test();
