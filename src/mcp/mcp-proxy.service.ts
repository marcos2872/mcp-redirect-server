/* eslint-disable @typescript-eslint/no-unsafe-call */
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
  private currentToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  async getToken(forceRefresh = false): Promise<string> {
    // Retorna token em cache se ainda válido
    if (
      !forceRefresh &&
      this.currentToken &&
      this.tokenExpiresAt &&
      Date.now() < this.tokenExpiresAt
    ) {
      this.logger.debug('Using cached token');
      return this.currentToken;
    }

    const authUrl = this.configService.get<string>('EXTERNAL_API_LOGIN_URL');
    const user = this.configService.get<string>('EXTERNAL_API_USER');
    const pass = this.configService.get<string>('EXTERNAL_API_PASSWORD');

    if (!authUrl || !user || !pass) {
      throw new Error('Authentication configuration is incomplete');
    }

    try {
      this.logger.log('Refreshing authentication token...');

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

      const token = data.token || data.access_token;

      // Armazena token e calcula expiração
      this.currentToken = token;

      // Se a resposta incluir expires_in, usa esse valor
      // Caso contrário, assume 1 hora de validade
      const expiresInSeconds = data.expires_in || 3600;

      // Define expiração com margem de segurança (5 minutos antes)
      this.tokenExpiresAt = Date.now() + (expiresInSeconds - 300) * 1000;

      this.logger.log(
        `Token refreshed successfully. Expires in ${expiresInSeconds}s`,
      );

      return token;
    } catch (error) {
      this.logger.error('Authentication failed', error);
      this.currentToken = null;
      this.tokenExpiresAt = null;
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
    await this.ensureConnectedWithRetry();
    try {
      const response = await this.client!.listTools();
      return response.tools;
    } catch (error) {
      // Tenta reconectar se falhar por erro de autenticação
      if (this.isAuthError(error)) {
        this.logger.warn('Authentication error detected, refreshing token...');
        await this.reconnectWithNewToken();
        const response = await this.client!.listTools();
        return response.tools;
      }
      this.logger.error('Failed to list tools', error);
      throw error;
    }
  }

  async callTool(name: string, args: any): Promise<any> {
    await this.ensureConnectedWithRetry();
    try {
      this.logger.log(`Calling tool: ${name}`, args);
      const response = await this.client!.callTool({ name, arguments: args });
      return response;
    } catch (error) {
      // Tenta reconectar se falhar por erro de autenticação
      if (this.isAuthError(error)) {
        this.logger.warn('Authentication error detected, refreshing token...');
        await this.reconnectWithNewToken();
        const response = await this.client!.callTool({ name, arguments: args });
        return response;
      }
      this.logger.error(`Failed to call tool: ${name}`, error);
      throw error;
    }
  }

  async listResources(): Promise<any> {
    await this.ensureConnectedWithRetry();
    try {
      const response = await this.client!.listResources();
      return response.resources;
    } catch (error) {
      // Tenta reconectar se falhar por erro de autenticação
      if (this.isAuthError(error)) {
        this.logger.warn('Authentication error detected, refreshing token...');
        await this.reconnectWithNewToken();
        const response = await this.client!.listResources();
        return response.resources;
      }
      this.logger.error('Failed to list resources', error);
      throw error;
    }
  }

  async readResource(uri: string): Promise<any> {
    await this.ensureConnectedWithRetry();
    try {
      const response = await this.client!.readResource({ uri });
      return response;
    } catch (error) {
      // Tenta reconectar se falhar por erro de autenticação
      if (this.isAuthError(error)) {
        this.logger.warn('Authentication error detected, refreshing token...');
        await this.reconnectWithNewToken();
        const response = await this.client!.readResource({ uri });
        return response;
      }
      this.logger.error(`Failed to read resource: ${uri}`, error);
      throw error;
    }
  }

  async listPrompts(): Promise<any> {
    await this.ensureConnectedWithRetry();
    try {
      const response = await this.client!.listPrompts();
      return response.prompts;
    } catch (error) {
      // Tenta reconectar se falhar por erro de autenticação
      if (this.isAuthError(error)) {
        this.logger.warn('Authentication error detected, refreshing token...');
        await this.reconnectWithNewToken();
        const response = await this.client!.listPrompts();
        return response.prompts;
      }
      this.logger.error('Failed to list prompts', error);
      throw error;
    }
  }

  async getPrompt(name: string, args?: any): Promise<any> {
    await this.ensureConnectedWithRetry();
    try {
      const response = await this.client!.getPrompt({ name, arguments: args });
      return response;
    } catch (error) {
      // Tenta reconectar se falhar por erro de autenticação
      if (this.isAuthError(error)) {
        this.logger.warn('Authentication error detected, refreshing token...');
        await this.reconnectWithNewToken();
        const response = await this.client!.getPrompt({
          name,
          arguments: args,
        });
        return response;
      }
      this.logger.error(`Failed to get prompt: ${name}`, error);
      throw error;
    }
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  private async ensureConnectedWithRetry(): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.logger.warn('Client not connected, attempting to connect...');
      await this.connect();
    }

    // Verifica se o token está próximo de expirar
    if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt) {
      this.logger.warn('Token expired or about to expire, refreshing...');
      await this.reconnectWithNewToken();
    }
  }

  private async reconnectWithNewToken(): Promise<void> {
    try {
      this.logger.log('Reconnecting with new token...');

      // Desconecta cliente atual
      if (this.client) {
        await this.disconnect();
      }

      // Força refresh do token
      const newToken = await this.getToken(true);

      // Reconecta com novo token
      const externalMcpUrl = this.configService.get<string>('EXTERNAL_MCP_URL');

      const transport = new SSEClientTransport(
        new URL(externalMcpUrl as string),
        {
          requestInit: {
            headers: {
              authorization: `Bearer ${newToken}`,
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

      this.logger.log('Successfully reconnected with new token');
    } catch (error) {
      this.logger.error('Failed to reconnect with new token', error);
      throw error;
    }
  }

  private isAuthError(error: any): boolean {
    // Detecta erros relacionados à autenticação
    const errorStr = error?.toString().toLowerCase() || '';
    const messageStr = error?.message?.toLowerCase() || '';

    return (
      errorStr.includes('unauthorized') ||
      errorStr.includes('401') ||
      errorStr.includes('forbidden') ||
      errorStr.includes('403') ||
      errorStr.includes('token') ||
      errorStr.includes('auth') ||
      messageStr.includes('unauthorized') ||
      messageStr.includes('401') ||
      messageStr.includes('forbidden') ||
      messageStr.includes('403') ||
      messageStr.includes('token') ||
      messageStr.includes('auth')
    );
  }
}
