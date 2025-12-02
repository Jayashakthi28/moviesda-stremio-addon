/**
 * Stremio Meta Handler
 * Returns metadata for a given IMDb ID
 * Format: /api/meta/movie/tt1234567.json
 */

const { findMovieInDB } = require('../../../../lib/search');

export default async function handler(req, res) {
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

    const { type, id } = req.query;

    // Remove .json extension if present
    const imdbId = id.replace('.json', '');

    console.log(`\n📚 Meta request: ${type} / ${imdbId}`);

    try {
        const movieData = await findMovieInDB(imdbId);

        if (!movieData) {
            console.log('📺 Movie not found in database');
            return res.status(404).json({ 
                meta: null 
            });
        }

        // ADDED: Return proper Stremio meta format with HTTPS poster URLs
        const meta = {
            id: imdbId,
            type: type || 'movie',
            name: movieData.title || movieData.name || 'Unknown Title',
            // ADDED: Ensure poster URL is HTTPS
            poster: movieData.poster && movieData.poster.startsWith('http:') 
                ? movieData.poster.replace('http:', 'https:') 
                : movieData.poster || 'https://via.placeholder.com/300x450?text=No+Poster',
            // Optional fields
            ...(movieData.description && { description: movieData.description }),
            ...(movieData.releaseInfo && { releaseInfo: movieData.releaseInfo }),
            ...(movieData.year && { year: movieData.year }),
            ...(movieData.imdbRating && { imdbRating: movieData.imdbRating }),
            ...(movieData.genre && { genre: Array.isArray(movieData.genre) ? movieData.genre : [movieData.genre] }),
            ...(movieData.director && { director: Array.isArray(movieData.director) ? movieData.director : [movieData.director] }),
            ...(movieData.cast && { cast: Array.isArray(movieData.cast) ? movieData.cast : [movieData.cast] }),
            // ADDED: behaviorHints for proper display
            behaviorHints: {
                defaultVideoId: null
            }
        };

        console.log(`📚 Returning meta for: ${meta.name}`);
        return res.status(200).json({ meta });

    } catch (error) {
        console.error(`❌ Error in meta handler: ${error.message}`);
        return res.status(500).json({ 
            meta: null,
            error: error.message 
        });
    }
}
