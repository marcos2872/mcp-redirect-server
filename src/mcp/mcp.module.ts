import { Global, Module } from '@nestjs/common';
import {
  McpModule as RekoMcpModule,
  McpAuthJwtGuard,
  McpTransportType,
} from '@rekog/mcp-nest';
import { ToolsService } from './mcp.tools';

@Global()
@Module({
  imports: [
    RekoMcpModule.forRoot({
      name: 'simple-api',
      version: '1.0.0',
      transport: [McpTransportType.SSE],
      guards: [McpAuthJwtGuard],
    }),
  ],
  providers: [ToolsService, McpAuthJwtGuard],
})
export class McpModule {}
