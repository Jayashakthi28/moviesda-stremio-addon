/**
 * Stremio Addon Manifest
 * Returns the addon configuration
 */

const manifest = {
    id: 'community.moviesda.tamil',
    version: '1.0.0',
    
    // ADDED: manifestVersion is required by Stremio
    manifestVersion: 1,
    
    name: 'MoviesDA by JSV',
    description: 'Stream Tamil movies from Moviesda website',

    // Resources provided by this addon
    // ADDED: 'meta' resource for metadata display
    resources: ['stream', 'meta'],

    // Types supported
    types: ['movie', 'series'],

    catalogs: [],

    // ID Prefixes (IMDb IDs start with 'tt')
    idPrefixes: ['tt'],
    
    // ADDED: behaviorHints for better addon behavior
    behaviorHints: {
        adult: false,
        p2p: false,
        configurable: false,
        configurationRequired: false
    },

    // Optional: Addon icon and background
    logo: 'https://media.tenor.com/6AdlfWdtvAEAAAAM/singamuthu-laugh.gif',
    background: 'https://media.tenor.com/6AdlfWdtvAEAAAAM/singamuthu-laugh.gif'
};

export default function handler(req, res) {
    // CORS headers with preflight support
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // ADDED: Strict cache-busting headers to prevent iOS caching issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Return manifest
    res.status(200).json(manifest);
}

