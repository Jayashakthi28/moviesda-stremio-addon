/**
 * Database utilities for MoviesDA addon
 */

const fs = require('fs');
const path = require('path');

// Cache database in memory
let movieDatabase = null;

/**
 * Load movie database from JSON file
 */
function loadDatabase() {
    if (movieDatabase === null) {
        try {
            const dbPath = path.join(process.cwd(), 'moviesda_full_db_with_imdb.json');
            const data = fs.readFileSync(dbPath, 'utf-8');
            movieDatabase = JSON.parse(data);
            console.log(`✅ Loaded ${movieDatabase.length} movies from database`);
        } catch (error) {
            console.error(`❌ Error loading database: ${error.message}`);
            movieDatabase = [];
        }
    }
    return movieDatabase;
}

module.exports = { loadDatabase };

