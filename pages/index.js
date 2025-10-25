import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [manifestUrl, setManifestUrl] = useState('');

  useEffect(() => {
    // Get the current domain on client side
    if (typeof window !== 'undefined') {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      setManifestUrl(`${baseUrl}/api/manifest.json`);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(manifestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallInStremio = () => {
    if (manifestUrl) {
      // Construct Stremio install URL
      const stremioInstallUrl = `stremio://${manifestUrl.replace(/^https?:\/\//, '')}`;
      window.location.href = stremioInstallUrl;
    }
  };

  return (
    <div className="container">
      <Head>
        <title>MoviesDA by JSV - Stremio Addon</title>
        <meta name="description" content="Stream Tamil movies from Moviesda website" />
        <link rel="icon" href="https://media.tenor.com/6AdlfWdtvAEAAAAM/singamuthu-laugh.gif" />
      </Head>

      <main className="main">
        <div className="logo-container">
          <img src="https://media.tenor.com/6AdlfWdtvAEAAAAM/singamuthu-laugh.gif" alt="MoviesDA Logo" className="logo" />
        </div>

        <h1 className="title">
          MoviesDA by JSV
        </h1>

        <p className="description">
          Stream Tamil movies from Moviesda website
        </p>

        <div className="card">
          <h2>Quick Install</h2>
          <button onClick={handleInstallInStremio} className="install-btn" disabled={!manifestUrl}>
            🚀 Install in Stremio
          </button>
          <p className="or-divider">or</p>
          <h2>Manual Installation</h2>
          <div className="url-box">
            <code>{manifestUrl || 'Loading...'}</code>
          </div>
          <button onClick={handleCopy} className="copy-btn" disabled={!manifestUrl}>
            {copied ? '✓ Copied!' : '📋 Copy URL'}
          </button>
        </div>

        <div className="instructions">
          <h3>How to Install:</h3>
          <div className="install-methods">
            <div className="method">
              <h4>🚀 Quick Install (Recommended)</h4>
              <ol>
                <li>Make sure Stremio is installed on your device</li>
                <li>Click the <strong>"Install in Stremio"</strong> button above</li>
                <li>Stremio will open with the addon installation prompt</li>
                <li>Click <strong>Install</strong> to add the addon</li>
              </ol>
            </div>
            <div className="method">
              <h4>📋 Manual Install</h4>
              <ol>
                <li>Copy the installation URL above</li>
                <li>Open Stremio and click the <strong>Addons</strong> button (puzzle icon)</li>
                <li>Click <strong>Community Addons</strong> at the top</li>
                <li>Paste the URL in the search box</li>
                <li>Click <strong>Install</strong></li>
              </ol>
            </div>
          </div>
        </div>

        <div className="features">
          <h3>Features:</h3>
          <ul>
            <li>✅ Automatic IMDb title matching</li>
            <li>✅ 5000+ Tamil movies database</li>
            <li>✅ Multiple stream sources</li>
            <li>✅ Quality detection (1080p, 720p, etc.)</li>
            <li>✅ Works with any IMDb ID</li>
          </ul>
        </div>

        <div className="links">
          <a href="/api/manifest.json" target="_blank">View Manifest</a>
          <a href="https://www.stremio.com" target="_blank">Download Stremio</a>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          max-width: 800px;
        }

        .logo-container {
          margin-bottom: 2rem;
        }

        .logo {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          border: 5px solid rgba(255, 255, 255, 0.3);
          object-fit: cover;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 3.5rem;
          text-align: center;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .description {
          text-align: center;
          line-height: 1.5;
          font-size: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 1rem 0 3rem;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .card h2 {
          margin-top: 0;
          color: #333;
          font-size: 1.3rem;
        }

        .card h2:not(:first-child) {
          margin-top: 1.5rem;
        }

        .install-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.2rem;
          font-weight: 700;
          transition: all 0.3s ease;
          width: 100%;
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        .install-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }

        .install-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          box-shadow: none;
        }

        .install-btn:disabled:hover {
          transform: none;
        }

        .or-divider {
          text-align: center;
          color: #999;
          margin: 1.5rem 0;
          font-weight: 500;
          position: relative;
        }

        .or-divider::before,
        .or-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #ddd;
        }

        .or-divider::before {
          left: 0;
        }

        .or-divider::after {
          right: 0;
        }

        .url-box {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          overflow-x: auto;
        }

        .url-box code {
          color: #667eea;
          font-size: 0.9rem;
          word-break: break-all;
        }

        .copy-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .copy-btn:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .copy-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .copy-btn:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        .instructions, .features {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .instructions h3, .features h3 {
          margin-top: 0;
          color: #333;
        }

        .install-methods {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .method h4 {
          color: #667eea;
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .instructions ol, .features ul {
          text-align: left;
          line-height: 2;
          color: #555;
        }

        @media (max-width: 768px) {
          .install-methods {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        .links {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
        }

        .links a {
          color: white;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .links a:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        @media (max-width: 600px) {
          .logo {
            width: 100px;
            height: 100px;
          }
          .title {
            font-size: 2.5rem;
          }
          .description {
            font-size: 1.2rem;
          }
          .links {
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

