import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { McpProxyService } from './mcp-proxy.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ToolsService implements OnModuleInit {
  private readonly logger = new Logger(ToolsService.name);

  constructor(
    private readonly mcpProxy: McpProxyService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Conecta ao servidor MCP externo na inicialização
    const externalMcpUrl = this.configService.get<string>('EXTERNAL_MCP_URL');
    const externalMcpToken =
      this.configService.get<string>('EXTERNAL_MCP_TOKEN');

    if (externalMcpUrl) {
      try {
        await this.mcpProxy.connect({
          url: externalMcpUrl,
          token: externalMcpToken,
        });
        this.logger.log('MCP Proxy initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize MCP Proxy', error);
      }
    } else {
      this.logger.warn(
        'EXTERNAL_MCP_URL not configured. Proxy will not connect.',
      );
    }
  }

  @Tool({
    name: 'proxy_list_tools',
    description:
      'Lista todas as ferramentas disponíveis no servidor MCP externo',
  })
  async listExternalTools() {
    return await this.mcpProxy.listTools();
  }

  @Tool({
    name: 'proxy_call_tool',
    description: 'Chama uma ferramenta no servidor MCP externo',
  })
  async callExternalTool(args: { toolName: string; toolArgs: any }) {
    return await this.mcpProxy.callTool(args.toolName, args.toolArgs);
  }

  @Tool({
    name: 'proxy_list_resources',
    description: 'Lista todos os recursos disponíveis no servidor MCP externo',
  })
  async listExternalResources() {
    return await this.mcpProxy.listResources();
  }

  @Tool({
    name: 'proxy_read_resource',
    description: 'Lê um recurso do servidor MCP externo',
  })
  async readExternalResource(args: { uri: string }) {
    return await this.mcpProxy.readResource(args.uri);
  }

  @Tool({
    name: 'proxy_list_prompts',
    description: 'Lista todos os prompts disponíveis no servidor MCP externo',
  })
  async listExternalPrompts() {
    return await this.mcpProxy.listPrompts();
  }

  @Tool({
    name: 'proxy_get_prompt',
    description: 'Obtém um prompt do servidor MCP externo',
  })
  async getExternalPrompt(args: { promptName: string; promptArgs?: any }) {
    return await this.mcpProxy.getPrompt(args.promptName, args.promptArgs);
  }
}
