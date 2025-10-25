/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class McpProxyService {
  constructor(private readonly configService: ConfigService) {}
  private readonly logger = new Logger(McpProxyService.name);
  private client: Client | null = null;
  private isConnected = false;

  async getToken(): Promise<string> {
    const authUrl = this.configService.get<string>('EXTERNAL_API_LOGIN_URL');
    const user = this.configService.get<string>('EXTERNAL_API_USER');
    const pass = this.configService.get<string>('EXTERNAL_API_PASSWORD');

    if (!authUrl || !user || !pass) {
      throw new Error('Authentication configuration is incomplete');
    }

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user, password: pass }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to authenticate: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.token && !data.access_token) {
        throw new Error('No token found in authentication response');
      }

      return data.token || data.access_token;
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    try {
      const externalMcpUrl = this.configService.get<string>('EXTERNAL_MCP_URL');

      if (!externalMcpUrl) {
        this.logger.warn(
          'EXTERNAL_MCP_URL not configured. Proxy will not connect.',
        );
      }

      const token = await this.getToken();

      const transport = new SSEClientTransport(
        new URL(externalMcpUrl as string),
        {
          requestInit: {
            headers: {
              authorization: `Bearer ${token}`,
            },
          },
        },
      );

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
