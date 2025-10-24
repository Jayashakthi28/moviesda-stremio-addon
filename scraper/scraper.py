from ctypes import sizeof
import requests
from bs4 import BeautifulSoup
import string
import time
import json
from collections import deque
from requests.exceptions import ConnectionError, Timeout, RequestException
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

base_url = "https://moviesda1.io"
letters = list(string.ascii_lowercase)
movie_db = []
processed_urls = set()  # Track processed movie URLs to avoid duplicates
processed_titles = set()  # Track processed movie titles to avoid duplicates
output_file = "moviesda_full_db.json"

# Parallel processing settings
MAX_WORKERS_LETTERS = 5   # Process 5 letters at a time
MAX_WORKERS_MOVIES = 10   # Process 10 movies per letter in parallel

# Thread-safe locks
db_lock = threading.Lock()
url_lock = threading.Lock()
title_lock = threading.Lock()
save_lock = threading.Lock()
print_lock = threading.Lock()

def normalize_title(title):
    """
    Normalize movie title for comparison.
    Removes extra spaces, converts to lowercase, removes special chars.
    """
    if not title or title == "Unknown":
        return None
    # Convert to lowercase and remove extra whitespace
    normalized = ' '.join(title.lower().split())
    # Remove common variations
    normalized = normalized.replace('tamil movie', '').replace('movie', '')
    normalized = ' '.join(normalized.split())
    return normalized if normalized else None

def load_existing_data(filename):
    """Load existing movie data from JSON file if it exists."""
    try:
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)
            print(f"✅ Loaded {len(data)} existing records from {filename}")
            
            # Count movies with valid data
            valid_movies = sum(1 for m in data if m.get('title') and m.get('title') != 'Unknown')
            print(f"   📊 {valid_movies} movies with valid titles")
            
            return data
    except FileNotFoundError:
        print(f"ℹ️  No existing data file found. Starting fresh.")
        return []
    except json.JSONDecodeError:
        print(f"⚠️  Error reading {filename}. Starting fresh.")
        return []

def save_to_json(data, filename):
    """Save movie data to JSON file (thread-safe)."""
    with save_lock:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  💾 Saved {len(data)} records to {filename}")

def safe_print(message):
    """Thread-safe print function."""
    with print_lock:
        print(message)

def retry_request(url, max_retries=3, timeout=10, backoff_factor=2):
    """
    Retry a request with exponential backoff on failure.
    
    Args:
        url: The URL to fetch
        max_retries: Maximum number of retry attempts
        timeout: Request timeout in seconds
        backoff_factor: Multiplier for delay between retries
    
    Returns:
        Response object if successful, None if all retries failed
    """
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, timeout=timeout)
            resp.raise_for_status()  # Raise an exception for bad status codes
            return resp
        except (ConnectionError, Timeout, RequestException) as e:
            if attempt < max_retries - 1:
                wait_time = backoff_factor ** attempt
                print(f"      ! Connection error (attempt {attempt + 1}/{max_retries}): {e}")
                print(f"      ! Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"      ! Failed after {max_retries} attempts: {e}")
                return None
    return None

def get_movies_from_letter(letter):
    """Fetch all movie links for a given letter across all pages."""
    movie_links = []
    page = 1
    
    while True:
        if page == 1:
            url = f"{base_url}/tamil-movies/{letter}/"
        else:
            url = f"{base_url}/tamil-movies/{letter}/?page={page}"
        
        safe_print(f"    [{letter}] Fetching page {page}...")
        resp = retry_request(url)
        if resp is None:
            safe_print(f"      [{letter}] Failed to fetch page {page}, skipping...")
            break
        soup = BeautifulSoup(resp.text, "html.parser")
        
        page_movie_links = []
        for a in soup.select('.f>a'): 
            movie_url = a['href']
            if movie_url.startswith('/'):
                movie_url = base_url + movie_url
            page_movie_links.append(movie_url)
        
        if len(page_movie_links)==0:
            break
        
        movie_links.extend(page_movie_links)
        safe_print(f"      [{letter}] Found {len(page_movie_links)} movies on page {page}")
        
        page += 1
        time.sleep(0.3)  # Reduced delay for faster parallel processing
    
    safe_print(f"  ✓ [{letter}] Total movies found: {len(movie_links)}")
    return movie_links

def get_download_items(movie_url):
    """Fetch download links for a specific movie URL."""
    def normalize_and_add_to_queue(links, queue):
        """Helper function to normalize URLs and add to queue"""
        for link in links:
            link_url = link.get('href', '')
            if link_url.startswith('/'):
                link_url = base_url + link_url
            if link_url:
                queue.append(link_url)
    
    resp = retry_request(movie_url)
    if resp is None:
        safe_print(f"  Failed to fetch movie page, skipping...")
        return {"url": movie_url, "title": "Unknown", "download_links": []}
    
    soup = BeautifulSoup(resp.text, "html.parser")
    title_tag = soup.select(".line")[1] if len(soup.select(".line")) > 1 else None
    movie_title = title_tag.get_text(strip=True) if title_tag else "Unknown"
    safe_print(f"  📽️  {movie_title}")

    link_queue = deque()
    download_links = [] 
    
    initial_links = soup.select(".f a")
    normalize_and_add_to_queue(initial_links, link_queue)
    
    while link_queue:
        current_url = link_queue.popleft()
        
        time.sleep(0.2)  # Reduced delay
        resp = retry_request(current_url, max_retries=2, timeout=8)
        
        if resp is None:
            continue
        
        try:
            soup = BeautifulSoup(resp.text, "html.parser")
            
            child_links = soup.select('.f a')
            if len(child_links) > 0:
                normalize_and_add_to_queue(child_links, link_queue)
            
            current_page_download_links = soup.select(".dlink a")
            if len(current_page_download_links) > 0:
                for link in current_page_download_links:
                    href = link.get('href', '')
                    if href:
                        download_links.append(href)
                
        except Exception as e:
            continue
    
    download_links = list(set(download_links))
    safe_print(f"    ✓ {movie_title}: {len(download_links)} download links")
    
    return {
        "url": movie_url,
        "title": movie_title,
        "download_links": download_links,
    }

def is_duplicate_movie(movie_url, movie_title=None):
    """
    Check if movie is already processed (by URL or title).
    Returns (is_duplicate, reason)
    """
    # Check URL first (fast check)
    with url_lock:
        if movie_url in processed_urls:
            return True, "URL already processed"
    
    # If we have a title, check for title duplicates
    if movie_title and movie_title != "Unknown":
        normalized = normalize_title(movie_title)
        if normalized:
            with title_lock:
                if normalized in processed_titles:
                    return True, f"Title already exists: '{movie_title}'"
    
    return False, None

def mark_movie_as_processed(movie_url, movie_title):
    """Mark a movie as processed (thread-safe)."""
    with url_lock:
        processed_urls.add(movie_url)
    
    if movie_title and movie_title != "Unknown":
        normalized = normalize_title(movie_title)
        if normalized:
            with title_lock:
                processed_titles.add(normalized)

def process_movie(movie_url, new_movies_counter):
    """Process a single movie (thread-safe)."""
    # Check if already processed by URL
    is_dup, reason = is_duplicate_movie(movie_url)
    if is_dup:
        safe_print(f"  ⏭️  Skipping: {reason}")
        return None
    
    try:
        # Fetch movie data
        movie_data = get_download_items(movie_url)
        movie_title = movie_data.get('title', 'Unknown')
        
        # Double-check for title duplicates (in case multiple threads fetched same movie)
        is_dup, reason = is_duplicate_movie(movie_url, movie_title)
        if is_dup:
            safe_print(f"  ⏭️  Skipping (duplicate detected): {reason}")
            return None
        
        # Mark as processed
        mark_movie_as_processed(movie_url, movie_title)
        
        # Add to database (thread-safe)
        with db_lock:
            movie_db.append(movie_data)
            new_movies_counter[0] += 1
            
        return movie_data
    except Exception as e:
        safe_print(f"  ❌ Error processing {movie_url}: {e}")
        # Still mark URL as processed to avoid infinite retries
        with url_lock:
            processed_urls.add(movie_url)
        return None

def process_letter(letter, new_movies_counter, save_interval):
    """Process all movies for a given letter (with parallel movie processing)."""
    safe_print(f"\n🔤 Scraping movies for letter '{letter.upper()}'")
    
    try:
        movie_pages = get_movies_from_letter(letter)
        
        if not movie_pages:
            safe_print(f"  ℹ️  No movies found for '{letter}'")
            return
        
        # Filter out already processed URLs
        with url_lock:
            new_movie_pages = [mp for mp in movie_pages if mp not in processed_urls]
        
        if not new_movie_pages:
            safe_print(f"  ⏭️  All movies for '{letter}' already processed")
            return
        
        safe_print(f"  📊 [{letter}] Processing {len(new_movie_pages)} new movies (out of {len(movie_pages)} total)")
        
        # Process movies in parallel
        with ThreadPoolExecutor(max_workers=MAX_WORKERS_MOVIES) as executor:
            futures = [executor.submit(process_movie, mp, new_movies_counter) for mp in new_movie_pages]
            
            completed = 0
            for future in as_completed(futures):
                completed += 1
                
                # Save progress periodically
                if new_movies_counter[0] % save_interval == 0 and new_movies_counter[0] > 0:
                    with db_lock:
                        save_to_json(movie_db, output_file)
                        safe_print(f"    📊 Progress: {new_movies_counter[0]} new movies, {len(movie_db)} total")
        
        safe_print(f"  ✅ [{letter}] Completed processing")
        
    except Exception as e:
        safe_print(f"  ❌ Error processing letter '{letter}': {e}")

# Load existing data and populate processed URLs and titles
movie_db = load_existing_data(output_file)
print("\n🔍 Building duplicate detection index...")

for movie in movie_db:
    # Track URLs
    if 'url' in movie:
        processed_urls.add(movie['url'])
    
    # Track titles (normalized)
    if 'title' in movie:
        title = movie['title']
        if title and title != "Unknown":
            normalized = normalize_title(title)
            if normalized:
                processed_titles.add(normalized)

print(f"   ✅ Indexed {len(processed_urls)} URLs")
print(f"   ✅ Indexed {len(processed_titles)} unique titles")

# Check for potential duplicates in existing data
if len(processed_urls) != len(processed_titles):
    duplicate_count = len(processed_urls) - len(processed_titles)
    print(f"   ⚠️  Found {duplicate_count} potential duplicate titles in existing data")

# Use list for thread-safe counter
new_movies_counter = [0]
save_interval = 30
initial_count = len(movie_db)

print(f"\n🚀 Starting scraper with PARALLEL processing...")
print(f"   📊 Already in database: {len(movie_db)} movies")
print(f"   🔒 Protected by: URL + Title duplicate detection")
print(f"⚡ Settings: {MAX_WORKERS_LETTERS} letters in parallel, {MAX_WORKERS_MOVIES} movies per letter")
print("=" * 80)

start_time = time.time()

# Process letters in parallel
with ThreadPoolExecutor(max_workers=MAX_WORKERS_LETTERS) as executor:
    futures = [executor.submit(process_letter, letter, new_movies_counter, save_interval) for letter in letters]
    
    # Wait for all to complete
    for future in as_completed(futures):
        pass  # Results are handled in process_letter

# Final save
elapsed_time = time.time() - start_time

print("\n" + "=" * 80)
with db_lock:
    save_to_json(movie_db, output_file)

print(f"\n✅ Scraping complete!")
print(f"   - New movies scraped: {new_movies_counter[0]}")
print(f"   - Total movies in database: {len(movie_db)}")
print(f"   - Movies added this session: {len(movie_db) - initial_count}")
print(f"   - Time taken: {elapsed_time:.1f} seconds ({elapsed_time/60:.1f} minutes)")
if new_movies_counter[0] > 0:
    print(f"   - Average rate: {new_movies_counter[0]/elapsed_time:.2f} movies/sec")
