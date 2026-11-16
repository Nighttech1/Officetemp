# Publishing to NPM

## First Time Setup

1. **Create NPM Account** (if you don't have one):
   ```bash
   npm adduser
   ```

2. **Login to NPM**:
   ```bash
   npm login
   ```

## Publishing Steps

### 1. Build the Package
```bash
cd design-clone-mcp
npm install
npm run build
```

### 2. Test Locally
```bash
# Test the built version
node dist/index.js

# Or test with npm link
npm link
design-clone-mcp
```

### 3. Publish to NPM
```bash
npm publish --access public
```

That's it! The package is now live at:
- https://npmjs.com/package/@minutelaunch/design-clone-mcp

### 4. Test the Published Package
```bash
npx @minutelaunch/design-clone-mcp
```

## Updating the Package

1. **Update version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Build and publish**:
   ```bash
   npm run build
   npm publish
   ```

## Adding to Smithery (Optional)

1. Go to https://smithery.ai
2. Click "Submit MCP Server"
3. Enter: `@minutelaunch/design-clone-mcp`
4. Done!

Smithery will automatically pull from NPM.

## GitHub Repository

1. **Create repo** on GitHub:
   ```
   https://github.com/wplaunchify/design-clone-mcp
   ```

2. **Push code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Design Clone MCP Server v1.0.0"
   git branch -M main
   git remote add origin https://github.com/wplaunchify/design-clone-mcp.git
   git push -u origin main
   ```

## Cost

- **GitHub:** FREE (public repo)
- **NPM:** FREE (public package)
- **Smithery:** FREE (listing)
- **Total:** $0

## Users Install With

```bash
npx @minutelaunch/design-clone-mcp
```

Or add to their MCP config and it auto-installs.

**That's it. One command. Just works.**

