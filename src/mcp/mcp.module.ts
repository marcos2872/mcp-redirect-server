import { Global, Module } from '@nestjs/common';
import { McpModule as RekoMcpModule } from '@rekog/mcp-nest';

@Global()
@Module({
  imports: [
    RekoMcpModule.forRoot({
      name: 'simple-api',
      version: '1.0.0',
      transport: [],
    }),
  ],
})
export class McpModule {}
