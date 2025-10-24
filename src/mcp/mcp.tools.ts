import { Tool } from '@rekog/mcp-nest';

export class ToolsService {
  constructor() {}

  @Tool({
    name: 'getUserByEmail',
    description: 'Get a specific user by Email',
  })
  tool() {
    return {
      message: 'tool',
    };
  }
}
