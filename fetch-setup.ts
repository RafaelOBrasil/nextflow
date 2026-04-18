console.log('Fetching setup-db...');
fetch('http://localhost:3000/api/setup-db')
  .then(res => res.json())
  .then(data => console.log('Response:', JSON.stringify(data, null, 2)))
  .catch(err => console.error('Error:', err));
