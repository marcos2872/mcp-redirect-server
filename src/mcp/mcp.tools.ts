/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { McpProxyService } from './mcp-proxy.service';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

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
    parameters: z.object({}),
  })
  async listExternalTools() {
    try {
      const tools = await this.mcpProxy.listTools();
      // Retorna apenas informações básicas
      return tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
      }));
    } catch (error) {
      this.logger.error('Failed to list tools', error);
      throw error;
    }
  }

  @Tool({
    name: 'proxy_call_tool',
    description: 'Chama uma ferramenta no servidor MCP externo',
    parameters: z.object({
      toolName: z.string().describe('Nome da ferramenta a ser chamada'),
      toolArgs: z
        .union([z.string(), z.record(z.any()), z.null()])
        .optional()
        .describe('Argumentos da ferramenta (JSON string ou object)'),
    }),
  })
  async callExternalTool(args: { toolName: string; toolArgs?: any }) {
    try {
      let parsedArgs = {};

      if (args.toolArgs) {
        // Se for string, tenta fazer parse do JSON
        if (typeof args.toolArgs === 'string') {
          const trimmed = args.toolArgs.trim();
          if (trimmed) {
            try {
              parsedArgs = JSON.parse(trimmed);
            } catch {
              // Se não for JSON válido, usa como está
              parsedArgs = { value: trimmed };
            }
          }
        } else {
          parsedArgs = args.toolArgs;
        }
      }

      return await this.mcpProxy.callTool(args.toolName, parsedArgs);
    } catch (error) {
      this.logger.error('Failed to call tool', error);
      throw error;
    }
  }

  @Tool({
    name: 'proxy_list_resources',
    description: 'Lista todos os recursos disponíveis no servidor MCP externo',
    parameters: z.object({}),
  })
  async listExternalResources() {
    return await this.mcpProxy.listResources();
  }

  @Tool({
    name: 'proxy_read_resource',
    description: 'Lê um recurso do servidor MCP externo',
    parameters: z.object({
      uri: z.string().describe('URI do recurso a ser lido'),
    }),
  })
  async readExternalResource(args: { uri: string }) {
    return await this.mcpProxy.readResource(args.uri);
  }

  @Tool({
    name: 'proxy_list_prompts',
    description: 'Lista todos os prompts disponíveis no servidor MCP externo',
    parameters: z.object({}),
  })
  async listExternalPrompts() {
    return await this.mcpProxy.listPrompts();
  }

  @Tool({
    name: 'proxy_get_prompt',
    description: 'Obtém um prompt do servidor MCP externo',
    parameters: z.object({
      promptName: z.string().describe('Nome do prompt a ser obtido'),
      promptArgs: z.any().optional().describe('Argumentos do prompt'),
    }),
  })
  async getExternalPrompt(args: { promptName: string; promptArgs?: any }) {
    return await this.mcpProxy.getPrompt(args.promptName, args.promptArgs);
  }
}
