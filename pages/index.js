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

    return (
        <div className="container">
            <Head>
                <title>MoviesDA Stremio Addon</title>
                <meta name="description" content="Stremio addon for Tamil movies" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="main">
                <h1 className="title">
                    🎬 MoviesDA Stremio Addon
                </h1>

                <p className="description">
                    Stream Tamil movies from MoviesDA database
                </p>

                <div className="card">
                    <h2>Installation URL</h2>
                    <div className="url-box">
                        <code>{manifestUrl || 'Loading...'}</code>
                    </div>
                    <button onClick={handleCopy} className="copy-btn" disabled={!manifestUrl}>
                        {copied ? '✓ Copied!' : '📋 Copy URL'}
                    </button>
                </div>

                <div className="instructions">
                    <h3>How to Install:</h3>
                    <ol>
                        <li>Copy the installation URL above</li>
                        <li>Open Stremio and click the <strong>Addons</strong> button (puzzle icon)</li>
                        <li>Click <strong>Community Addons</strong> at the top</li>
                        <li>Paste the URL in the search box</li>
                        <li>Click <strong>Install</strong></li>
                    </ol>
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

        .instructions ol, .features ul {
          text-align: left;
          line-height: 2;
          color: #555;
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

