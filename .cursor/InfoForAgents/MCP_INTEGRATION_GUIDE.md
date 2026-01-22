# Hytopia SDK MCP Integration Guide for ChatGPT/Codex

## What is MCP (Model Context Protocol)?

MCP (Model Context Protocol) is a protocol that allows AI assistants like ChatGPT, Claude, and Cursor to access external resources, documentation, and tools. The Hytopia MCP server provides access to:

- **SDK Source Code** - Complete TypeScript source code from `/sdk`
- **Documentation** - Official guides and tutorials from `/docs`
- **Search Capabilities** - Semantic search across code and docs
- **Code Examples** - Real implementation examples

## Available Resources Through Hytopia MCP

### SDK Source Code (`/sdk`)
The complete Hytopia SDK source code is available, including:

- **Server-side** (`/sdk/server/src/`):
  - `players/` - Player management, camera, UI
  - `worlds/` - World, blocks, entities, physics, audio
  - `networking/` - Connection, serialization, WebSocket
  - `events/` - Event system
  - `models/`, `textures/`, `persistence/` - Asset and data management

- **Client-side** (`/sdk/client/src/`):
  - UI globals and client-side utilities

### Documentation (`/docs`)
- User interface guides
- API documentation
- Best practices and examples

## Setting Up MCP for ChatGPT/Codex

### Option 1: Using Cursor (Current Setup)
Cursor already has MCP integration built-in. The Hytopia MCP is automatically available when working in Cursor.

**What you can do in Cursor:**
- Ask questions: "How do I create a custom entity?"
- Search code: "Find examples of player event handling"
- Browse files: Access any SDK file or documentation
- Get code examples: "Show me how to implement a shop system"

### Option 2: Setting Up for ChatGPT/Claude Desktop

To use Hytopia MCP with ChatGPT or Claude Desktop, you need to configure MCP servers:

#### Step 1: Install MCP Server
The Hytopia MCP server needs to be installed and configured. Check if there's an official MCP server package:

```bash
npm install -g @hytopia/mcp-server
# or
npm install @hytopia/mcp-server
```

#### Step 2: Configure MCP in ChatGPT/Claude
Create or edit the MCP configuration file:

**For Claude Desktop:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**For ChatGPT (if supported):**
- Check OpenAI's documentation for MCP configuration

#### Step 3: Add Hytopia MCP Configuration
Add the Hytopia MCP server to your configuration:

```json
{
  "mcpServers": {
    "hytopia": {
      "command": "node",
      "args": ["path/to/hytopia-mcp-server/index.js"],
      "env": {}
    }
  }
}
```

**Note:** The exact configuration depends on how the Hytopia MCP server is distributed. Check the official Hytopia documentation or GitHub repository for the correct setup.

### Option 3: Manual Integration (Alternative)

If MCP isn't available, you can manually provide context:

1. **Copy SDK Documentation URLs:**
   - Main docs: https://github.com/hytopiagg/sdk/blob/main/docs/server.md
   - Examples: https://github.com/hytopiagg/sdk/tree/main/examples/payload-game

2. **Reference in Prompts:**
   When asking ChatGPT/Codex questions, include:
   ```
   "Using the Hytopia SDK documentation at https://github.com/hytopiagg/sdk..."
   ```

3. **Create a Context File:**
   Create a `HYTOPIA_CONTEXT.md` file with key SDK information and reference it in your prompts.

## How to Use MCP Resources Effectively

### 1. Ask Questions
Use natural language questions:
- "How do I create a custom entity in Hytopia?"
- "Show me examples of player event handling"
- "What's the best way to implement a shop system?"

### 2. Search for Code
Search semantically:
- "Find code that handles player joining the world"
- "Show me collision detection examples"
- "How is the physics simulation implemented?"

### 3. Browse Documentation
Access specific documentation:
- `/docs/sdk-guides/user-interface.md`
- `/docs/sdk-guides/user-interface/scene-uis.md`

### 4. Explore SDK Code
Browse the SDK source:
- `/sdk/server/src/players/Player.ts`
- `/sdk/server/src/worlds/World.ts`
- `/sdk/server/src/entities/Entity.ts`

## Available MCP Tools

The Hytopia MCP provides these tools:

1. **`askQuestion`** - Ask questions and get AI-generated answers from docs
2. **`search`** - Semantic search across SDK and documentation
3. **`ls`** - List files and directories in the virtual filesystem
4. **`cat`** - Read complete file contents
5. **`grep`** - Search for regex patterns across files
6. **`tree`** - View complete file structure

## Example Usage

### In Cursor (Current):
```
You: "How do I create a custom entity that follows a player?"

AI: [Uses MCP to search SDK, finds Entity.ts and examples, provides code]
```

### In ChatGPT/Codex (with MCP configured):
```
You: "Using the Hytopia SDK, show me how to create a merchant NPC"

AI: [Accesses MCP, retrieves relevant code and docs, provides implementation]
```

## Key Hytopia SDK Resources

### Official Links (Reference in prompts):
- **Main Documentation**: https://github.com/hytopiagg/sdk/blob/main/docs/server.md
- **SDK Repository**: https://github.com/hytopiagg/sdk
- **NPM Package**: https://www.npmjs.com/package/hytopia
- **Examples**: https://github.com/hytopiagg/sdk/tree/main/examples/payload-game
- **Discord**: https://discord.gg/DXCXJbHSJX
- **Issues/Bugs**: https://github.com/hytopiagg/sdk/issues

### Your Project Structure:
- Main entry: `index.ts`
- Core game logic: `src/Core/`
- Mining system: `src/Mining/`
- Shop system: `src/Shop/`
- Pet system: `src/Pets/`
- Planning docs: `Planning/`

## Tips for Effective Integration

1. **Be Specific**: Ask specific questions rather than general ones
2. **Reference Your Code**: When asking, mention your project structure
3. **Use Examples**: Ask for code examples based on your existing patterns
4. **Combine Resources**: Reference both SDK docs and your project's planning files

## Troubleshooting

### MCP Not Working?
1. Check if MCP server is running
2. Verify configuration file syntax
3. Check server logs for errors
4. Ensure Node.js and dependencies are installed

### Can't Find Documentation?
- Use the `search` tool with semantic queries
- Browse the `/docs` directory structure
- Check the official GitHub repository

### Code Examples Not Relevant?
- Be more specific about your use case
- Reference your existing code patterns
- Ask for examples matching your project structure

## Next Steps

1. **Test MCP Access**: Try asking questions about the Hytopia SDK
2. **Explore Documentation**: Browse available guides and examples
3. **Search Code**: Find relevant SDK implementations
4. **Integrate Learnings**: Apply SDK patterns to your project

---

**Note**: This guide assumes the Hytopia MCP server is available. If you need help setting it up, check:
- Hytopia Discord: https://discord.gg/DXCXJbHSJX
- SDK GitHub Issues: https://github.com/hytopiagg/sdk/issues
- Official Hytopia documentation
