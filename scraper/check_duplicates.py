#!/usr/bin/env python3
"""
Utility script to check for duplicate movies in the database.
Can identify duplicates by URL or title and optionally remove them.
"""

import json
import sys

def normalize_title(title):
    """Normalize movie title for comparison."""
    if not title or title == "Unknown":
        return None
    normalized = ' '.join(title.lower().split())
    normalized = normalized.replace('tamil movie', '').replace('movie', '')
    normalized = ' '.join(normalized.split())
    return normalized if normalized else None

def check_duplicates(filename, fix=False):
    """
    Check for duplicate movies in the database.
    
    Args:
        filename: Path to JSON database file
        fix: If True, remove duplicates (keeps first occurrence)
    """
    print(f"📂 Loading: {filename}")
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            movies = json.load(f)
    except FileNotFoundError:
        print(f"❌ File not found: {filename}")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return
    
    print(f"📊 Total movies in database: {len(movies)}\n")
    
    # Track duplicates
    seen_urls = {}
    seen_titles = {}
    url_duplicates = []
    title_duplicates = []
    
    # Find duplicates
    for i, movie in enumerate(movies):
        url = movie.get('url', '')
        title = movie.get('title', 'Unknown')
        normalized = normalize_title(title)
        
        # Check URL duplicates
        if url:
            if url in seen_urls:
                url_duplicates.append({
                    'index': i,
                    'url': url,
                    'title': title,
                    'first_seen': seen_urls[url]
                })
            else:
                seen_urls[url] = i
        
        # Check title duplicates
        if normalized:
            if normalized in seen_titles:
                title_duplicates.append({
                    'index': i,
                    'title': title,
                    'normalized': normalized,
                    'url': url,
                    'first_seen': seen_titles[normalized],
                    'first_title': movies[seen_titles[normalized]].get('title')
                })
            else:
                seen_titles[normalized] = i
    
    # Report findings
    print("=" * 80)
    print("🔍 DUPLICATE ANALYSIS")
    print("=" * 80)
    
    print(f"\n📊 Statistics:")
    print(f"   • Total movies: {len(movies)}")
    print(f"   • Unique URLs: {len(seen_urls)}")
    print(f"   • Unique titles: {len(seen_titles)}")
    print(f"   • URL duplicates: {len(url_duplicates)}")
    print(f"   • Title duplicates: {len(title_duplicates)}")
    
    # Show URL duplicates
    if url_duplicates:
        print(f"\n⚠️  DUPLICATE URLs FOUND ({len(url_duplicates)}):")
        print("-" * 80)
        for dup in url_duplicates[:10]:  # Show first 10
            print(f"   [{dup['index']}] {dup['title']}")
            print(f"       URL: {dup['url']}")
            print(f"       First seen at index: {dup['first_seen']}")
            print()
        if len(url_duplicates) > 10:
            print(f"   ... and {len(url_duplicates) - 10} more\n")
    else:
        print(f"\n✅ No URL duplicates found")
    
    # Show title duplicates
    if title_duplicates:
        print(f"\n⚠️  DUPLICATE TITLES FOUND ({len(title_duplicates)}):")
        print("-" * 80)
        for dup in title_duplicates[:10]:  # Show first 10
            print(f"   [{dup['index']}] {dup['title']}")
            print(f"       Normalized: {dup['normalized']}")
            print(f"       URL: {dup['url']}")
            print(f"       First seen at index: {dup['first_seen']} - '{dup['first_title']}'")
            print()
        if len(title_duplicates) > 10:
            print(f"   ... and {len(title_duplicates) - 10} more\n")
    else:
        print(f"\n✅ No title duplicates found")
    
    # Fix duplicates if requested
    if fix and (url_duplicates or title_duplicates):
        print("\n" + "=" * 80)
        print("🔧 REMOVING DUPLICATES")
        print("=" * 80)
        
        # Collect indices to remove (keep first occurrence)
        indices_to_remove = set()
        
        for dup in url_duplicates:
            indices_to_remove.add(dup['index'])
        
        for dup in title_duplicates:
            indices_to_remove.add(dup['index'])
        
        # Create cleaned database
        cleaned_movies = [movie for i, movie in enumerate(movies) if i not in indices_to_remove]
        
        print(f"\n📊 Results:")
        print(f"   • Original: {len(movies)} movies")
        print(f"   • Removed: {len(indices_to_remove)} duplicates")
        print(f"   • Remaining: {len(cleaned_movies)} movies")
        
        # Backup original file
        backup_file = filename.replace('.json', '_backup.json')
        print(f"\n💾 Creating backup: {backup_file}")
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(movies, f, ensure_ascii=False, indent=2)
        
        # Save cleaned database
        print(f"💾 Saving cleaned database: {filename}")
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(cleaned_movies, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Duplicates removed successfully!")
        print(f"   Original file backed up to: {backup_file}")
    
    elif url_duplicates or title_duplicates:
        print("\n" + "=" * 80)
        print("💡 TIP: Run with --fix to automatically remove duplicates")
        print("   Example: python check_duplicates.py moviesda_full_db.json --fix")
        print("=" * 80)
    
    print("\n✅ Analysis complete!")

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_duplicates.py <database_file> [--fix]")
        print("\nExamples:")
        print("  python check_duplicates.py moviesda_full_db.json")
        print("  python check_duplicates.py moviesda_full_db.json --fix")
        sys.exit(1)
    
    filename = sys.argv[1]
    fix = '--fix' in sys.argv or '-f' in sys.argv
    
    if fix:
        print("⚠️  WARNING: This will modify your database file!")
        print("   A backup will be created automatically.")
        response = input("\nContinue? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            print("❌ Cancelled")
            return
    
    check_duplicates(filename, fix)

if __name__ == "__main__":
    main()

