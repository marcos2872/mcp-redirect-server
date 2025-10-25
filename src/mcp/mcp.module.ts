import { Global, Module } from '@nestjs/common';
import {
  McpModule as RekoMcpModule,
  McpAuthJwtGuard,
  McpTransportType,
} from '@rekog/mcp-nest';
import { DynamicToolsService } from './dynamic-tools.service';
import { McpProxyService } from './mcp-proxy.service';

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
  providers: [DynamicToolsService, McpAuthJwtGuard, McpProxyService],
  exports: [McpProxyService, DynamicToolsService],
})
export class McpModule {}
