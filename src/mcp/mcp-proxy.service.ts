/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

interface McpServerConfig {
  url: string;
  token?: string;
  headers?: Record<string, string>;
}

@Injectable()
export class McpProxyService {
  private readonly logger = new Logger(McpProxyService.name);
  private client: Client | null = null;
  private isConnected = false;

  async connect(config: McpServerConfig): Promise<void> {
    try {
      this.logger.log(`Connecting to external MCP server: ${config.url}`);

      const headers: Record<string, string> = {
        ...config.headers,
      };

      // Adiciona token se fornecido
      if (config.token) {
        headers['Authorization'] = `Bearer ${config.token}`;
      }

      const transport = new SSEClientTransport(new URL(config.url), {
        requestInit: {
          headers,
        },
      });

      this.client = new Client(
        {
          name: 'mcp-proxy-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        },
      );

      await this.client.connect(transport);
      this.isConnected = true;

      this.logger.log('Successfully connected to external MCP server');
    } catch (error) {
      this.logger.error('Failed to connect to external MCP server', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      this.logger.log('Disconnected from external MCP server');
    }
  }

  async listTools(): Promise<any> {
    this.ensureConnected();
    try {
      const response = await this.client!.listTools();
      return response.tools;
    } catch (error) {
      this.logger.error('Failed to list tools', error);
      throw error;
    }
  }

  async callTool(name: string, args: any): Promise<any> {
    this.ensureConnected();
    try {
      this.logger.log(`Calling tool: ${name}`, args);
      const response = await this.client!.callTool({ name, arguments: args });
      return response;
    } catch (error) {
      this.logger.error(`Failed to call tool: ${name}`, error);
      throw error;
    }
  }

  async listResources(): Promise<any> {
    this.ensureConnected();
    try {
      const response = await this.client!.listResources();
      return response.resources;
    } catch (error) {
      this.logger.error('Failed to list resources', error);
      throw error;
    }
  }

  async readResource(uri: string): Promise<any> {
    this.ensureConnected();
    try {
      const response = await this.client!.readResource({ uri });
      return response;
    } catch (error) {
      this.logger.error(`Failed to read resource: ${uri}`, error);
      throw error;
    }
  }

  async listPrompts(): Promise<any> {
    this.ensureConnected();
    try {
      const response = await this.client!.listPrompts();
      return response.prompts;
    } catch (error) {
      this.logger.error('Failed to list prompts', error);
      throw error;
    }
  }

  async getPrompt(name: string, args?: any): Promise<any> {
    this.ensureConnected();
    try {
      const response = await this.client!.getPrompt({ name, arguments: args });
      return response;
    } catch (error) {
      this.logger.error(`Failed to get prompt: ${name}`, error);
      throw error;
    }
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  private ensureConnected(): void {
    if (!this.isConnected || !this.client) {
      throw new Error('MCP client is not connected');
    }
  }
}
