/**
 * IMDb utilities
 */

const https = require('https');
const { parse } = require('node-html-parser');

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

module.exports = { getMovieTitleFromIMDb };

