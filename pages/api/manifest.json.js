/**
 * Stremio Addon Manifest
 * Returns the addon configuration
 */

const manifest = {
    id: 'community.moviesda.tamil',
    version: '1.0.0',
    name: 'MoviesDA by JSV',
    description: 'Stream Tamil movies from Moviesda website',

    // Resources provided by this addon
    resources: ['stream'],

    // Types supported
    types: ['movie', 'series'],

    catalogs: [],

    // ID Prefixes (IMDb IDs start with 'tt')
    idPrefixes: ['tt'],

    // Optional: Addon icon and background
    logo: 'https://media.tenor.com/6AdlfWdtvAEAAAAM/singamuthu-laugh.gif',
    background: 'https://media.tenor.com/6AdlfWdtvAEAAAAM/singamuthu-laugh.gif'
};

export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Return manifest
    res.status(200).json(manifest);
}

