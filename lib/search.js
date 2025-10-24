const { loadDatabase } = require('./database');
const { parse } = require('node-html-parser');


/**
 * Find movie in database by IMDb ID
 */
async function findMovieInDB(imdbId) {
    const database = loadDatabase();

    if (!database || database.length === 0) {
        return null;
    }

    console.log(`🔍 Searching for IMDb ID: ${imdbId}`);

    // Search database by imdb_id directly
    const movie = database.find(m => m.imdb_id === imdbId);

    if (movie) {
        console.log(`✅ Found movie: ${movie.title} with ${movie.download_links?.length || 0} download links`);
    } else {
        console.log(`❌ No movie found with IMDb ID: ${imdbId}`);
    }

    return movie;
}



async function scrapeStreamUrl(link) {
    // Convert URL from db format to correct format
    // From: https://movies.downloadpage.site/download/file/52198
    // To: https://download.moviespage.site/download/page/52198
    const fileId = link.match(/\/file\/(\d+)$/)?.[1];
    const downloadPageUrl = fileId
        ? `https://download.moviespage.site/download/page/${fileId}`
        : link;

    const response = await fetch(downloadPageUrl);
    const html = await response.text();
    const root = parse(html);

    const detailsElements = root.querySelectorAll('.details');
    let fileName = '';
    let fileSize = '';
    let videoSize = '';
    let format = '';
    let duration = '';
    let addedOn = '';

    if (detailsElements.length > 0) {
        for (let i = 0; i < detailsElements.length; i++) {
            const element = detailsElements[i];
            const strongTag = element.querySelector('strong');
            if (strongTag) {
                const value = element.text.replace(strongTag.text, '').trim();

                if (i === 0) fileName = value;
                else if (i === 1) fileSize = value;
                else if (i === 2) videoSize = value;
                else if (i === 3) format = value;
                else if (i === 4) duration = value;
                else if (i === 5) addedOn = value;
            }
        }
    }

    console.log({ fileName, fileSize, videoSize, format, duration, addedOn });

    const downloadElement = root.querySelector('.download');
    if (downloadElement) {
        const links = downloadElement.querySelectorAll('.dlink a');
        const streamUrls = [];

        for (const linkEl of links) {
            const href = linkEl.getAttribute('href');
            if (href) {
                streamUrls.push({
                    url: href,
                    name: `MoviesDA⚡️\n\n${videoSize}\n\n[Tamil]`,
                    description: `${fileName}\n\n📦 File Size: ${fileSize}\n📺 Video Size: ${videoSize}\n🎞️ Format: ${format}\n⏱️ Duration: ${duration}\n📅 Added On: ${addedOn}`,
                    title: fileName,
                    fileSize: fileSize,
                    behaviorHints: {
                        filename: fileName,
                    }
                });
            }
        }

        // Sort by file size in descending order
        streamUrls.sort((a, b) => {
            const parseSize = (size) => {
                const match = size.match(/([\d.]+)\s*(GB|MB|KB)/i);
                if (!match) return 0;
                const value = parseFloat(match[1]);
                const unit = match[2].toUpperCase();
                if (unit === 'GB') return value * 1024;
                if (unit === 'MB') return value;
                if (unit === 'KB') return value / 1024;
                return value;
            };
            return parseSize(b.fileSize) - parseSize(a.fileSize);
        });

        // Remove fileSize property before returning
        streamUrls.forEach(stream => delete stream.fileSize);

        return streamUrls;
    }

    return [];
}

async function scrapeAllStreams(downloadLinks) {
    const streams = [];

    for (const link of downloadLinks) {
        const linkStreams = await scrapeStreamUrl(link);
        if (linkStreams && linkStreams.length > 0) {
            streams.push(...linkStreams);
        }
    }

    console.log(streams);

    return streams;
}

module.exports = { findMovieInDB, scrapeAllStreams };

