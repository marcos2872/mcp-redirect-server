import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule } from './mcp/mcp.module';
import { McpAuthModule, GitHubOAuthProvider } from '@rekog/mcp-nest';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    McpAuthModule.forRoot({
      provider: GitHubOAuthProvider,
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      jwtSecret: process.env.JWT_SECRET!,
      resource: process.env.RESOURCE_URL || 'http://localhost:3000/mcp',
      serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
      apiPrefix: 'auth',
    }),
    McpModule,
  ],
})
export class AppModule {}
