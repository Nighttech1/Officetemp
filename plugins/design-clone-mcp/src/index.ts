#!/usr/bin/env node

/**
 * Design Clone MCP Server
 * 
 * One-click website design cloning with Puppeteer
 * Just say: "Clone the design from stripe.com"
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { cloneDesign } from './tools/clone-design.js';

const server = new Server(
  {
    name: 'design-clone-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'clone_website_design',
        description: 'Clone a website design by capturing HTML, CSS, colors, fonts, and layout. Returns structured design data that can be used to recreate the page.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL of the website to clone (e.g., https://stripe.com/pricing)',
            },
          },
          required: ['url'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'clone_website_design') {
    const url = request.params.arguments?.url as string;
    
    if (!url) {
      throw new Error('URL is required');
    }

    try {
      const designData = await cloneDesign(url);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(designData, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to clone design: ${errorMessage}`);
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Design Clone MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

