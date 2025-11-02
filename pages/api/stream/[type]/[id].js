/**
 * Stremio Stream Handler
 * Returns streams for a given IMDb ID
 * Format: /api/stream/movie/tt1234567.json
 */

const { findMovieInDB, scrapeAllStreams, getReadyStreams } = require('../../../../lib/search');


export default async function handler(req, res) {
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

    console.log(req.query);

    const { type, id } = req.query;


    // Remove .json extension if present
    const imdbId = id.replace('.json', '');

    console.log(`\n🎬 Stream request: ${type} / ${imdbId}`);

    try {
        const movieData = await findMovieInDB(imdbId);

        if (!movieData) {
            console.log('📺 Returning 0 streams (no match found)');
            return res.status(200).json({ streams: [] });
        }

        if (!movieData.download_links || movieData.download_links.length === 0) {
            console.log('📺 No download links found for this movie');
            return res.status(200).json({ streams: [] });
        }

        console.log(`🔗 Found ${movieData.download_links.length} download links`);

        const streams = await scrapeAllStreams(movieData.download_links);

        const readyStreams = await getReadyStreams(movieData);

        const allStreams = [...readyStreams, ...streams];

        console.log(`📺 Returning ${allStreams.length} stream(s)`);

        return res.status(200).json({ streams: allStreams });

    } catch (error) {
        console.error(`❌ Error in stream handler: ${error.message}`);
        return res.status(200).json({ streams: [] });
    }
}

