# MoviesDA Stremio Addon

A Next.js-based Stremio addon that provides Tamil movie streams from your MoviesDA database. Deploy for **FREE** on Vercel!

## 🎯 Features

- ✅ **Next.js API Routes** - Optimized for serverless deployment
- ✅ **Vercel Ready** - Deploy in minutes, completely free
- ✅ **IMDb Integration** - Automatic title fetching from IMDb
- ✅ **Fuzzy Matching** - Smart search with similarity scoring
- ✅ **Quality Detection** - Auto-detect 1080p, 720p, 480p, 360p
- ✅ **Beautiful UI** - Landing page with installation instructions
- ✅ **CORS Enabled** - Works seamlessly with Stremio

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Visit: `http://localhost:3000`

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or deploy via [Vercel Dashboard](https://vercel.com) (recommended)

## 📁 Project Structure

```
moviesda-scraper/
├── pages/
│   ├── api/
│   │   ├── manifest.json.js       # Stremio manifest
│   │   └── stream/[type]/[id].js  # Stream handler
│   └── index.js                    # Landing page
├── lib/
│   ├── database.js                # Database loader
│   ├── imdb.js                    # IMDb scraper
│   └── search.js                  # Search & matching
├── moviesda_full_db.json          # Your database
├── scraper.py                     # Database scraper
├── package.json                   # Dependencies
├── next.config.js                 # Next.js config
└── vercel.json                    # Vercel config
```

## 🔧 Scripts

### Python Scripts

```bash
# Scrape MoviesDA database
python scraper.py

# Search by IMDb ID
python search_by_imdb.py tt1234567
```

### Node.js Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## 📚 Documentation

- **[Vercel Deployment Guide](./VERCEL_DEPLOY.md)** - Complete deployment guide
- **[Stremio Setup Guide](./STREMIO_README.md)** - Node.js addon guide
- **[Search Tool Guide](./README_SEARCH.md)** - IMDb search tool

## 🌐 API Endpoints

- `GET /` - Landing page with installation instructions
- `GET /api/manifest.json` - Stremio addon manifest
- `GET /api/stream/:type/:id.json` - Get streams for movie/series

Example:
```
https://your-app.vercel.app/api/stream/movie/tt0468569.json
```

## 🎬 Install in Stremio

After deployment:

1. Open Stremio
2. Click **Addons** (puzzle icon)
3. Click **Community Addons**
4. Paste your addon URL:
   ```
   https://your-app.vercel.app/api/manifest.json
   ```
5. Click **Install**

## ⚙️ Configuration

### Manifest Settings

Edit `pages/api/manifest.json.js`:

```javascript
const manifest = {
    id: 'community.moviesda.tamil',
    version: '1.0.0',
    name: 'MoviesDA Tamil Movies',
    description: 'Your description',
    // ... other settings
};
```

### Search Threshold

Edit `lib/search.js`:

```javascript
// Adjust similarity threshold (0.0 - 1.0)
if (score > bestScore && score > 0.5) {  // Change 0.5
```

## 📦 Tech Stack

### Frontend
- Next.js 14
- React 18
- CSS-in-JS (styled-jsx)

### Backend
- Next.js API Routes
- Node.js 18+
- Node-HTML-Parser (IMDb scraping)

### Python Tools
- BeautifulSoup4 (web scraping)
- Requests (HTTP client)

### Deployment
- Vercel (serverless)
- Free hosting with HTTPS

## 🔍 How It Works

```
User watches movie in Stremio
         ↓
Stremio sends IMDb ID (tt1234567)
         ↓
Addon fetches title from IMDb
         ↓
Fuzzy search local database
         ↓
Return matching streams
         ↓
User watches movie!
```

## 📊 Database Format

Your `moviesda_full_db.json` should have this structure:

```json
[
  {
    "url": "https://moviesda1.io/movie-name/",
    "title": "Movie Title 2023",
    "download_links": [
      "https://example.com/link1",
      "https://example.com/link2"
    ]
  }
]
```

## 🐛 Troubleshooting

### Database not loading
- Ensure `moviesda_full_db.json` exists in project root
- Check file is valid JSON
- Verify file size < 50MB (Vercel limit)

### No streams found
- Lower similarity threshold in `lib/search.js`
- Check if movie exists in database
- Verify IMDb ID format (`tt` prefix)

### Deployment fails
- Check all files are committed
- Verify `package.json` dependencies
- Check Vercel logs for errors

## 🎯 Vercel Free Tier

Perfect for Stremio addons:

- ✅ 100GB bandwidth/month
- ✅ Unlimited API requests
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Zero configuration
- ✅ Instant deploys

## 🔒 Important Notes

- This addon **only provides links** from your database
- It does **not host any content**
- Ensure you comply with copyright laws
- Use responsibly

## 📈 Future Enhancements

- [ ] Add caching for IMDb titles
- [ ] Support for TV series
- [ ] Multiple language support
- [ ] Catalog integration
- [ ] Subtitle support
- [ ] Better quality detection
- [ ] User authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - feel free to use and modify!

## 🙏 Credits

- [Stremio](https://www.stremio.com) - Streaming platform
- [Vercel](https://vercel.com) - Free hosting
- [Next.js](https://nextjs.org) - React framework

## 📞 Support

Having issues? Check:

1. [Vercel Deployment Guide](./VERCEL_DEPLOY.md)
2. [Stremio Documentation](https://github.com/Stremio/stremio-addon-sdk)
3. Project issues on GitHub

---

Made with ❤️ for Tamil movie lovers

