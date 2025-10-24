import { Global, Module } from '@nestjs/common';
import { McpTransportType, McpModule as RekoMcpModule } from '@rekog/mcp-nest';
import { ToolsService } from './mcp.tools';

@Global()
@Module({
  imports: [
    RekoMcpModule.forRoot({
      name: 'simple-api',
      version: '1.0.0',
      transport: [McpTransportType.SSE],
    }),
  ],
  providers: [ToolsService],
})
export class McpModule {}
