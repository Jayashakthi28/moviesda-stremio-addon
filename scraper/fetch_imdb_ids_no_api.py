#!/usr/bin/env python3
"""
Script to fetch IMDB IDs for movies in the database.
Uses IMDbPY library (no API key required).
Reads moviesda_full_db.json and adds imdb_id field to each movie.
Skips movies that already have an imdb_id.

Installation:
    pip install IMDbPY
"""

import json
import re
import time
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

try:
    from imdb import Cinemagoer
except ImportError:
    print("❌ Error: IMDbPY library not installed!")
    print("Please install it with: pip install IMDbPY")
    exit(1)

# File paths
INPUT_FILE = "moviesda_full_db.json"
OUTPUT_FILE = "moviesda_full_db_with_imdb.json"

# Parallel processing settings
MAX_WORKERS = 10  # Number of parallel threads
REQUEST_DELAY = 0.1  # Small delay between requests (in parallel)

# Thread-safe lock for printing and saving
print_lock = threading.Lock()
save_lock = threading.Lock()


def extract_title_and_year(title_string: str) -> tuple[Optional[str], Optional[str]]:
    """
    Extract movie title and year from the title string.
    
    Examples:
    - "Attakathi (2012)" -> ("Attakathi", "2012")
    - "Aruvi (2017) Tamil Movie" -> ("Aruvi", "2017")
    - "Some Movie" -> ("Some Movie", None)
    """
    # Try to extract year in parentheses
    year_match = re.search(r'\((\d{4})\)', title_string)
    year = year_match.group(1) if year_match else None
    
    # Remove year and extra text like "Tamil Movie", "Hindi Movie", etc.
    title = re.sub(r'\(\d{4}\)', '', title_string)
    title = re.sub(r'\b(Tamil|Hindi|Telugu|Malayalam|Kannada|English)\s+(Movie|Film)\b', '', title, flags=re.IGNORECASE)
    title = title.strip()
    
    return title, year


def fetch_imdb_id(ia: Cinemagoer, title: str, year: Optional[str] = None) -> tuple[Optional[str], str]:
    """
    Fetch IMDB ID using IMDbPY library.
    Returns tuple of (IMDB ID, result message).
    """
    try:
        # Small delay to avoid overwhelming the server
        time.sleep(REQUEST_DELAY)
        
        # Search for the movie
        results = ia.search_movie(title)
        
        if not results:
            return None, "❌ Not found"
        
        # If year is provided, try to find exact match
        if year:
            for movie in results[:5]:  # Check top 5 results
                movie_year = movie.get('year')
                if movie_year and str(movie_year) == year:
                    imdb_id = f"tt{movie.movieID}"
                    movie_title = movie.get('title', 'Unknown')
                    msg = f"✅ Found: {imdb_id} - {movie_title} ({movie_year})"
                    return imdb_id, msg
        
        # If no year match or no year provided, return first result
        movie = results[0]
        imdb_id = f"tt{movie.movieID}"
        movie_title = movie.get('title', 'Unknown')
        movie_year = movie.get('year', 'Unknown')
        msg = f"✅ Found: {imdb_id} - {movie_title} ({movie_year})"
        return imdb_id, msg
        
    except Exception as e:
        return None, f"⚠️  Error: {e}"


def load_movies(file_path: str) -> List[Dict]:
    """Load movies from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: File '{file_path}' not found!")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in '{file_path}': {e}")
        return []


def save_movies(movies: List[Dict], file_path: str, show_message: bool = True) -> None:
    """Save movies to JSON file (thread-safe)."""
    with save_lock:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(movies, f, indent=2, ensure_ascii=False)
        if show_message:
            print(f"\n💾 Saved to: {file_path}")


def safe_print(message: str) -> None:
    """Thread-safe print function."""
    with print_lock:
        print(message)


def process_movie(movie: Dict, index: int, total: int, ia: Cinemagoer) -> tuple[bool, str]:
    """
    Process a single movie to fetch its IMDB ID.
    Returns (success, status_message).
    """
    title_string = movie.get('title', 'Unknown')
    
    # Skip if already has IMDB ID
    if movie.get('imdb_id'):
        return False, 'skipped'
    
    # Extract title and year
    title, year = extract_title_and_year(title_string)
    
    if not title:
        msg = f"[{index}/{total}] {title_string}\n  ⚠️  Could not extract title"
        safe_print(msg)
        return False, 'failed'
    
    # Fetch IMDB ID
    imdb_id, result_msg = fetch_imdb_id(ia, title, year)
    
    status_msg = f"[{index}/{total}] {title_string}\n  {result_msg}"
    safe_print(status_msg)
    
    if imdb_id:
        movie['imdb_id'] = imdb_id
        return True, 'success'
    else:
        return False, 'failed'


def main():
    print("🎬 IMDB ID Fetcher (IMDbPY) - Parallel Edition")
    print("=" * 60)
    
    # Initialize IMDbPY
    print("\n🔧 Initializing IMDbPY...")
    ia = Cinemagoer()
    
    # Load existing database
    print(f"\n📂 Loading: {INPUT_FILE}")
    movies = load_movies(INPUT_FILE)
    
    if not movies:
        print("❌ No movies found!")
        return
    
    print(f"📊 Total movies: {len(movies)}")
    
    # Count movies that already have IMDB IDs
    movies_with_imdb = sum(1 for m in movies if m.get('imdb_id'))
    print(f"✓  Already have IMDB ID: {movies_with_imdb}")
    print(f"⏳ Need to fetch: {len(movies) - movies_with_imdb}")
    print(f"🚀 Using {MAX_WORKERS} parallel workers")
    
    # Process movies in parallel
    print("\n🔍 Fetching IMDB IDs...")
    print("-" * 60)
    
    fetched_count = 0
    skipped_count = 0
    failed_count = 0
    processed_count = 0
    
    start_time = time.time()
    
    # Create a ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks
        future_to_movie = {}
        for i, movie in enumerate(movies, 1):
            future = executor.submit(process_movie, movie, i, len(movies), ia)
            future_to_movie[future] = i
        
        # Process completed tasks
        for future in as_completed(future_to_movie):
            processed_count += 1
            success, status = future.result()
            
            if status == 'skipped':
                skipped_count += 1
            elif status == 'success':
                fetched_count += 1
            elif status == 'failed':
                failed_count += 1
            
            # Save progress every 50 movies
            if processed_count % 50 == 0:
                save_movies(movies, OUTPUT_FILE, show_message=False)
                elapsed = time.time() - start_time
                rate = processed_count / elapsed if elapsed > 0 else 0
                safe_print(f"\n💾 Progress: {processed_count}/{len(movies)} | Rate: {rate:.1f} movies/sec")
    
    # Save final results
    elapsed_time = time.time() - start_time
    print("\n" + "=" * 60)
    print("📊 Summary:")
    print(f"  • Skipped (already had IMDB ID): {skipped_count}")
    print(f"  • Successfully fetched: {fetched_count}")
    print(f"  • Failed to find: {failed_count}")
    print(f"  • Total processed: {len(movies)}")
    print(f"  • Time taken: {elapsed_time:.1f} seconds")
    print(f"  • Average rate: {len(movies)/elapsed_time:.1f} movies/sec")
    
    save_movies(movies, OUTPUT_FILE)
    print("\n✅ Done!")


if __name__ == "__main__":
    main()

