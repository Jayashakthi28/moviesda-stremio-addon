/**
 * MoviesDA Stremio Addon
 * Provides Tamil movie streams from local MoviesDA database
 */

const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { parse } = require('node-html-parser');

// Configuration
const DB_FILE = path.join(__dirname, 'moviesda_full_db.json');
const PORT = process.env.PORT || 7000;

// Addon Manifest
const manifest = {
    id: 'community.moviesda.tamil',
    version: '1.0.0',
    name: 'MoviesDA Tamil Movies',
    description: 'Stream Tamil movies from MoviesDA database. Supports IMDb movie IDs.',

    // Resources provided by this addon
    resources: ['stream'],

    // Types supported
    types: ['movie', 'series'],

    // Optional: Addon icon and background
    logo: 'https://i.imgur.com/44ueTES.png',
    background: 'https://i.imgur.com/t8wVwcg.jpg'
};

// Create addon builder
const builder = new addonBuilder(manifest);

// Global variable to cache database
let movieDatabase = null;

/**
 * Load movie database from JSON file
 */
function loadDatabase() {
    if (movieDatabase === null) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            movieDatabase = JSON.parse(data);
            console.log(`✅ Loaded ${movieDatabase.length} movies from database`);
        } catch (error) {
            console.error(`❌ Error loading database: ${error.message}`);
            movieDatabase = [];
        }
    }
    return movieDatabase;
}

/**
 * Fetch movie title from IMDb by scraping
 */
function getMovieTitleFromIMDb(imdbId) {
    return new Promise((resolve, reject) => {
        const url = `https://www.imdb.com/title/${imdbId}/`;

        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const root = parse(data);

                    // Try to find the title
                    const h1 = root.querySelector('h1');
                    if (h1) {
                        const title = h1.text.trim();
                        resolve(title);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error(`Error parsing IMDb page: ${error.message}`);
                    resolve(null);
                }
            });
        }).on('error', (error) => {
            console.error(`Error fetching IMDb: ${error.message}`);
            resolve(null);
        });
    });
}

/**
 * Calculate similarity between two strings
 */
function similarityScore(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
        return 1.0;
    }

    const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Find movie in database by IMDb ID
 */
async function findMovieInDB(imdbId) {
    const database = loadDatabase();

    if (!database || database.length === 0) {
        return null;
    }

    // Get movie title from IMDb
    const imdbTitle = await getMovieTitleFromIMDb(imdbId);

    if (!imdbTitle) {
        console.log(`❌ Could not fetch title for ${imdbId}`);
        return null;
    }

    console.log(`🔍 Searching for: ${imdbTitle}`);

    // Search database for best match
    let bestMatch = null;
    let bestScore = 0;

    for (const movie of database) {
        const title = movie.title || '';
        if (!title || title === 'Unknown') {
            continue;
        }

        const score = similarityScore(imdbTitle, title);

        if (score > bestScore && score > 0.5) {
            bestScore = score;
            bestMatch = movie;
        }
    }

    if (bestMatch) {
        console.log(`✅ Found match: ${bestMatch.title} (Score: ${(bestScore * 100).toFixed(1)}%)`);
    } else {
        console.log(`❌ No match found for: ${imdbTitle}`);
    }

    return bestMatch;
}

/**
 * Format movie data into Stremio stream format
 */
function formatStreams(movieData) {
    if (!movieData || !movieData.download_links) {
        return [];
    }

    const streams = [];
    const downloadLinks = movieData.download_links;

    downloadLinks.forEach((link, index) => {
        const stream = {
            url: link,
            title: `MoviesDA - Link ${index + 1}`
        };

        // Try to detect quality from URL
        const linkLower = link.toLowerCase();
        if (linkLower.includes('1080p') || linkLower.includes('fhd')) {
            stream.title = `MoviesDA 🎬 1080p - Link ${index + 1}`;
        } else if (linkLower.includes('720p') || linkLower.includes('hd')) {
            stream.title = `MoviesDA 🎬 720p - Link ${index + 1}`;
        } else if (linkLower.includes('480p')) {
            stream.title = `MoviesDA 🎬 480p - Link ${index + 1}`;
        } else if (linkLower.includes('360p')) {
            stream.title = `MoviesDA 🎬 360p - Link ${index + 1}`;
        }

        streams.push(stream);
    });

    return streams;
}

/**
 * Define stream handler
 * This is called when Stremio requests streams for a movie
 */
builder.defineStreamHandler(async (args) => {
    console.log(`\n🎬 Stream request: ${args.type} / ${args.id}`);

    try {
        // Find movie in database
        const movieData = await findMovieInDB(args.id);

        if (!movieData) {
            console.log('📺 Returning 0 streams (no match found)');
            return Promise.resolve({ streams: [] });
        }

        // Format streams
        const streams = formatStreams(movieData);

        console.log(`📺 Returning ${streams.length} stream(s)`);

        return Promise.resolve({ streams: streams });

    } catch (error) {
        console.error(`❌ Error in stream handler: ${error.message}`);
        return Promise.resolve({ streams: [] });
    }
});

// Start the addon server
console.log('='.repeat(60));
console.log('🎬 MoviesDA Stremio Addon');
console.log('='.repeat(60));

// Load database on startup
loadDatabase();

console.log(`\n🚀 Starting server on http://127.0.0.1:${PORT}`);
console.log(`\n📝 Install URL: http://127.0.0.1:${PORT}/manifest.json`);
console.log('   Copy this URL and add it in Stremio to install the addon');
console.log('='.repeat(60));
console.log('\n💡 Tip: To make this accessible online, deploy to a hosting service');
console.log('   and use HTTPS (required by Stremio)\n');

serveHTTP(builder.getInterface(), { port: PORT });

