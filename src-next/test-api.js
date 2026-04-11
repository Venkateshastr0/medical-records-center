// Test the medications API
async function testAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/pharmacy/medications');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Data:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
