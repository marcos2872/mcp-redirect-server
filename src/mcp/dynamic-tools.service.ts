import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Tool } from '@rekog/mcp-nest';
import { McpProxyService } from './mcp-proxy.service';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

interface ExternalTool {
  name: string;
  description: string;
  inputSchema?: any;
}

@Injectable()
export class DynamicToolsService implements OnModuleInit {
  private readonly logger = new Logger(DynamicToolsService.name);
  private externalTools: ExternalTool[] = [];

  constructor(
    private readonly mcpProxy: McpProxyService,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
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
        
        // Busca as tools do servidor externo
        await this.loadExternalTools();
        
        this.logger.log('Dynamic MCP Proxy initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Dynamic MCP Proxy', error);
      }
    } else {
      this.logger.warn(
        'EXTERNAL_MCP_URL not configured. Dynamic proxy will not connect.',
      );
    }
  }

  private async loadExternalTools() {
    try {
      const tools = await this.mcpProxy.listTools();
      this.externalTools = tools || [];
      
      this.logger.log(`Loaded ${this.externalTools.length} external tools:`, 
        this.externalTools.map(t => t.name).join(', '));

      // Registra cada tool externa dinamicamente
      for (const tool of this.externalTools) {
        this.registerDynamicTool(tool);
      }
    } catch (error) {
      this.logger.error('Failed to load external tools', error);
    }
  }

  private registerDynamicTool(tool: ExternalTool) {
    try {
      // Cria um schema Zod genérico para a tool
      const toolSchema = this.createSchemaFromInputSchema(tool.inputSchema);
      
      // Cria o método wrapper dinamicamente
      const toolMethod = async (args: any) => {
        this.logger.debug(`Calling external tool: ${tool.name}`, args);
        return await this.mcpProxy.callTool(tool.name, args || {});
      };

      // Aplica o decorador @Tool dinamicamente
      const toolConfig = {
        name: tool.name,
        description: tool.description || `External tool: ${tool.name}`,
        parameters: toolSchema,
      };

      // Adiciona o método à classe atual
      (this as any)[`dynamic_${tool.name}`] = toolMethod;

      // Aplica o decorador @Tool
      Tool(toolConfig)(this, `dynamic_${tool.name}`, {
        value: toolMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      this.logger.debug(`Registered dynamic tool: ${tool.name}`);
    } catch (error) {
      this.logger.error(`Failed to register tool ${tool.name}`, error);
    }
  }

  private createSchemaFromInputSchema(inputSchema: any): z.ZodType<any> {
    // Se não tem schema ou é inválido, usa um schema genérico
    if (!inputSchema || typeof inputSchema !== 'object') {
      return z.any().optional();
    }

    try {
      // Se tem properties, cria um objeto
      if (inputSchema.properties && typeof inputSchema.properties === 'object') {
        const schemaObj: Record<string, z.ZodType<any>> = {};
        
        for (const [key, prop] of Object.entries(inputSchema.properties)) {
          const propSchema = prop as any;
          
          // Cria schema baseado no tipo
          if (propSchema.type === 'string') {
            schemaObj[key] = z.string();
          } else if (propSchema.type === 'number') {
            schemaObj[key] = z.number();
          } else if (propSchema.type === 'boolean') {
            schemaObj[key] = z.boolean();
          } else if (propSchema.type === 'array') {
            schemaObj[key] = z.array(z.any());
          } else {
            schemaObj[key] = z.any();
          }

          // Adiciona descrição se existir
          if (propSchema.description) {
            schemaObj[key] = schemaObj[key].describe(propSchema.description);
          }

          // Torna opcional se não estiver em required
          if (!inputSchema.required?.includes(key)) {
            schemaObj[key] = schemaObj[key].optional();
          }
        }

        return z.object(schemaObj);
      }

      // Fallback para schema genérico
      return z.any().optional();
    } catch (error) {
      this.logger.warn(`Failed to parse schema for tool, using generic:`, error);
      return z.any().optional();
    }
  }

  // Método auxiliar para listar tools carregadas (para debug)
  getLoadedTools(): string[] {
    return this.externalTools.map(t => t.name);
  }
}