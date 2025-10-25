/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Tool, Resource, Prompt } from '@rekog/mcp-nest';
import { McpProxyService } from './mcp-proxy.service';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

interface ExternalTool {
  name: string;
  description: string;
  inputSchema?: any;
}

interface ExternalResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

interface ExternalPrompt {
  name: string;
  description?: string;
  arguments?: any[];
}

@Injectable()
export class DynamicToolsService implements OnModuleInit {
  private readonly logger = new Logger(DynamicToolsService.name);
  private externalTools: ExternalTool[] = [];
  private externalResources: ExternalResource[] = [];
  private externalPrompts: ExternalPrompt[] = [];

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

        // Busca resources e prompts do servidor externo
        await this.loadExternalResources();
        await this.loadExternalPrompts();

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

      this.logger.log(
        `Loaded ${this.externalTools.length} external tools:`,
        this.externalTools.map((t) => t.name).join(', '),
      );

      // Registra cada tool externa dinamicamente
      for (const tool of this.externalTools) {
        this.registerDynamicTool(tool);
      }
    } catch (error) {
      this.logger.error('Failed to load external tools', error);
    }
  }

  private async loadExternalResources() {
    try {
      const resources = await this.mcpProxy.listResources();
      this.externalResources = resources || [];

      this.logger.log(
        `Loaded ${this.externalResources.length} external resources:`,
        this.externalResources.map((r) => r.uri).join(', '),
      );

      // Registra cada resource externo dinamicamente
      for (const resource of this.externalResources) {
        this.registerDynamicResource(resource);
      }
    } catch (error) {
      this.logger.error('Failed to load external resources', error);
    }
  }

  private async loadExternalPrompts() {
    try {
      const prompts = await this.mcpProxy.listPrompts();
      this.externalPrompts = prompts || [];

      this.logger.log(
        `Loaded ${this.externalPrompts.length} external prompts:`,
        this.externalPrompts.map((p) => p.name).join(', '),
      );

      // Registra cada prompt externo dinamicamente
      for (const prompt of this.externalPrompts) {
        this.registerDynamicPrompt(prompt);
      }
    } catch (error) {
      this.logger.error('Failed to load external prompts', error);
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

  private registerDynamicResource(resource: ExternalResource) {
    try {
      // Cria o método wrapper para ler o resource
      const resourceMethod = async () => {
        this.logger.debug(`Reading external resource: ${resource.uri}`);
        return await this.mcpProxy.readResource(resource.uri);
      };

      // Aplica o decorador @Resource dinamicamente
      const resourceConfig = {
        uri: resource.uri,
        name: resource.name || resource.uri,
        description:
          resource.description || `External resource: ${resource.uri}`,
        mimeType: resource.mimeType,
      };

      // Adiciona o método à classe atual
      const methodName = `resource_${resource.uri.replace(/[^a-zA-Z0-9]/g, '_')}`;
      (this as any)[methodName] = resourceMethod;

      // Aplica o decorador @Resource
      Resource(resourceConfig)(this, methodName, {
        value: resourceMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      this.logger.debug(`Registered dynamic resource: ${resource.uri}`);
    } catch (error) {
      this.logger.error(`Failed to register resource ${resource.uri}`, error);
    }
  }

  private registerDynamicPrompt(prompt: ExternalPrompt) {
    try {
      // Cria um schema para os argumentos do prompt
      const promptSchema = this.createSchemaFromArguments(
        prompt.arguments || [],
      );

      // Cria o método wrapper para o prompt
      const promptMethod = async (args: any) => {
        this.logger.debug(`Getting external prompt: ${prompt.name}`, args);
        return await this.mcpProxy.getPrompt(prompt.name, args || {});
      };

      // Aplica o decorador @Prompt dinamicamente
      const promptConfig = {
        name: prompt.name,
        description: prompt.description || `External prompt: ${prompt.name}`,
        parameters: promptSchema as z.ZodObject<any, any, any, any, any>,
      };

      // Adiciona o método à classe atual
      (this as any)[`prompt_${prompt.name}`] = promptMethod;

      // Aplica o decorador @Prompt
      Prompt(promptConfig)(this, `prompt_${prompt.name}`, {
        value: promptMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      this.logger.debug(`Registered dynamic prompt: ${prompt.name}`);
    } catch (error) {
      this.logger.error(`Failed to register prompt ${prompt.name}`, error);
    }
  }

  private createSchemaFromInputSchema(inputSchema: any): z.ZodType<any> {
    // Se não tem schema ou é inválido, usa um schema genérico
    if (!inputSchema || typeof inputSchema !== 'object') {
      return z.any().optional();
    }

    try {
      // Se tem properties, cria um objeto
      if (
        inputSchema.properties &&
        typeof inputSchema.properties === 'object'
      ) {
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          if (!inputSchema.required?.includes(key)) {
            schemaObj[key] = schemaObj[key].optional();
          }
        }

        return z.object(schemaObj);
      }

      // Fallback para schema genérico
      return z.any().optional();
    } catch (error) {
      this.logger.warn(
        `Failed to parse schema for tool, using generic:`,
        error,
      );
      return z.any().optional();
    }
  }

  private createSchemaFromArguments(args: any[]): z.ZodType<any> {
    // Se não tem argumentos, retorna schema vazio
    if (!args || !Array.isArray(args) || args.length === 0) {
      return z.object({});
    }

    try {
      const schemaObj: Record<string, z.ZodType<any>> = {};

      for (const arg of args) {
        if (arg && typeof arg === 'object' && arg.name) {
          const argName = arg.name as string;

          // Cria schema baseado no tipo do argumento
          if (arg.type === 'string') {
            schemaObj[argName] = z.string();
          } else if (arg.type === 'number') {
            schemaObj[argName] = z.number();
          } else if (arg.type === 'boolean') {
            schemaObj[argName] = z.boolean();
          } else {
            schemaObj[argName] = z.any();
          }

          // Adiciona descrição se existir
          if (arg.description) {
            schemaObj[argName] = schemaObj[argName].describe(arg.description);
          }

          // Torna opcional se marcado como tal
          if (!arg.required) {
            schemaObj[argName] = schemaObj[argName].optional();
          }
        }
      }

      return z.object(schemaObj);
    } catch (error) {
      this.logger.warn(
        `Failed to parse arguments schema, using generic:`,
        error,
      );
      return z.object({});
    }
  }

  // Métodos auxiliares para listar itens carregados (para debug)
  getLoadedTools(): string[] {
    return this.externalTools.map((t) => t.name);
  }

  getLoadedResources(): string[] {
    return this.externalResources.map((r) => r.uri);
  }

  getLoadedPrompts(): string[] {
    return this.externalPrompts.map((p) => p.name);
  }
}
