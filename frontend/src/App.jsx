import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [links, setLinks] = useState([]);

  // Function to fetch all links from the backend
  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      } else {
        console.error('Failed to fetch links');
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  };

  // Fetch links when the component mounts
  useEffect(() => {
    fetchLinks();
  }, []);

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) {
      alert('Please enter a URL');
      return;
    }

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ long_url: longUrl }),
      });

      if (response.ok) {
        setLongUrl('');
        fetchLinks(); // Refresh the list of links
      } else {
        alert('Failed to create short link');
      }
    } catch (error) {
      console.error('Error creating short link:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ShortLink Service</h1>
        <p>Create a short URL from a long one</p>
      </header>
      <main>
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <input
              type="url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
            <button type="submit">Shorten</button>
          </form>
        </div>
        <div className="links-container">
          <h2>Recent Links</h2>
          <table>
            <thead>
              <tr>
                <th>Short Link</th>
                <th>Original URL</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td>
                    <a href={`/${link.short_code}`} target="_blank" rel="noopener noreferrer">
                      {window.location.host}/{link.short_code}
                    </a>
                  </td>
                  <td>
                    <a href={link.long_url} target="_blank" rel="noopener noreferrer">
                      {link.long_url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;