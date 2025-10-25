import { Tool } from '@rekog/mcp-nest';

export class ToolsService {
  constructor() {}

  @Tool({
    name: 'tool',
    description: 'tool',
  })
  tool(context?: any) {
    console.log('Executing tool with context:', context);
    return {
      message: 'tool',
    };
  }
}
