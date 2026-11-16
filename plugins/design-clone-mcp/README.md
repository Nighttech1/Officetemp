# Design Clone MCP Server

**One-click website design cloning with Puppeteer**

Clone any website's design and get structured data (HTML, CSS, colors, fonts, layout) that you can use to recreate it.

## 🚀 Installation

### One Command Install:

```bash
npx @minutelaunch/design-clone-mcp
```

Or install globally:

```bash
npm install -g @minutelaunch/design-clone-mcp
```

## 📋 Prerequisites

- Node.js 18+ (Puppeteer requirement)
- That's it!

Puppeteer (including Chromium) is bundled automatically.

## 🎯 Usage

### In Cursor or Claude Desktop:

Just say:
```
"Clone the design from https://stripe.com"
```

The MCP server will:
1. Launch Puppeteer
2. Capture the website design
3. Extract colors, fonts, HTML, CSS
4. Return structured data
5. You can then use it to create pages

### Manual Testing:

```bash
# Start the server
design-clone-mcp

# Or with npx
npx @minutelaunch/design-clone-mcp
```

## 🔧 Configuration

### For Cursor:

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "design-clone": {
      "command": "npx",
      "args": ["@minutelaunch/design-clone-mcp"]
    }
  }
}
```

### For Claude Desktop:

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "design-clone": {
      "command": "npx",
      "args": ["@minutelaunch/design-clone-mcp"]
    }
  }
}
```

## 📊 What Gets Captured

- ✅ **HTML** - Full rendered HTML (up to 50KB)
- ✅ **Colors** - All background and text colors (top 20)
- ✅ **Fonts** - All font families used (top 10)
- ✅ **Sections** - Header, main, footer, etc. with computed styles
- ✅ **Layout** - Padding, margin, display properties
- ✅ **Metadata** - Capture timestamp, viewport size

## 🎨 Example Output

```json
{
  "url": "https://stripe.com/pricing",
  "title": "Pricing - Stripe",
  "colors": [
    "rgb(99, 91, 255)",
    "rgb(10, 37, 64)",
    "rgb(255, 255, 255)"
  ],
  "fonts": [
    "Inter, sans-serif",
    "system-ui"
  ],
  "sections": [
    {
      "tag": "header",
      "className": "site-header",
      "html": "<header>...</header>",
      "computedStyles": {
        "backgroundColor": "rgb(255, 255, 255)",
        "color": "rgb(10, 37, 64)",
        "fontSize": "16px",
        "fontFamily": "Inter, sans-serif",
        "padding": "20px",
        "margin": "0px"
      }
    }
  ],
  "metadata": {
    "capturedAt": "2025-10-28T12:00:00.000Z",
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

## 🔌 Available Tools

### `clone_website_design`

Clone a website's design and get structured data.

**Parameters:**
- `url` (string, required) - The URL to clone

**Returns:**
- Structured design data (JSON)

## 🛠️ Development

```bash
# Clone the repo
git clone https://github.com/wplaunchify/design-clone-mcp.git
cd design-clone-mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start
```

## 📝 Notes

- **Timeout:** Default 30 seconds per page
- **Size Limits:** HTML limited to 50KB, sections limited to 10
- **Public Sites Only:** Only captures publicly accessible websites
- **No Authentication:** Can't capture sites requiring login

## 🐛 Troubleshooting

### Puppeteer won't install
```bash
npm install puppeteer --unsafe-perm=true
```

### Timeout errors
Increase timeout in the code or try again (some sites are slow)

### "Command not found"
Make sure Node.js 18+ is installed:
```bash
node --version
```

## 📄 License

MIT

## 👤 Author

MinuteLaunch Team

---

**Just works. No configuration. One command.** 🚀

