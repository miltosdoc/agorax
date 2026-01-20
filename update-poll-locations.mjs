// Simple script to call the update-poll-locations endpoint
const fetchAPI = async () => {
  try {
    // First login to get a session
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'miltos',
        password: 'test123'
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      console.error('Login failed:', loginError);
      return;
    }

    console.log('Successfully logged in');

    // Now call the update endpoint
    const updateResponse = await fetch('http://localhost:5000/api/admin/update-poll-locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!updateResponse.ok) {
      const updateError = await updateResponse.json();
      console.error('Update failed:', updateError);
      return;
    }

    const result = await updateResponse.json();
    console.log('Update successful:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

fetchAPI();