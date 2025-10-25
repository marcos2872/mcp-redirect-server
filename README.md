# MCP Redirect Server

Servidor MCP (Model Context Protocol) Proxy com autenticação OAuth que se conecta a servidores MCP externos com autenticação simples por token.

## 🎯 Objetivo

Este servidor atua como um **proxy/ponte** entre:

- **Cliente** → Autentica via OAuth (GitHub)
- **Seu Servidor (Proxy)** → Recebe requisições OAuth e redireciona
- **Servidor MCP Externo** → Autenticação simples por token

**Use case**: Você tem um servidor MCP com autenticação simples (token), mas precisa usá-lo em um sistema que só aceita OAuth. Este servidor faz a ponte entre ambos.

## 🚀 Características

- 🔐 **Autenticação OAuth 2.1** com GitHub no frontend
- 🌉 **Proxy MCP** - Conecta a servidores MCP externos
- 🔑 **Token Authentication** - Autentica no servidor externo via token
- 🛠️ **Tool Forwarding** - Redireciona chamadas de tools
- 📁 **Resource Forwarding** - Redireciona acesso a recursos
- 💬 **Prompt Forwarding** - Redireciona prompts
- 📡 **SSE Transport** - Server-Sent Events para comunicação em tempo real
- 🔒 **Guard-based Security** - Proteção de rotas com JWT
- 💉 **Dependency Injection** - Sistema DI completo do NestJS

## 📦 Instalação

```bash
pnpm install
```

## ⚙️ Configuração

### 1. Criar GitHub OAuth App

1. Acesse: https://github.com/settings/developers
2. Clique em **"New OAuth App"**
3. Preencha:
   - **Application name**: `mcp-redirect-server`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
4. Copie o **Client ID** e **Client Secret**

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite o `.env` e adicione suas credenciais:

```env
# OAuth Provider (GitHub)
GITHUB_CLIENT_ID=seu_client_id_aqui
GITHUB_CLIENT_SECRET=seu_client_secret_aqui

# JWT Configuration (mínimo 32 caracteres)
JWT_SECRET=my-super-secure-jwt-secret-key-with-at-least-32-characters

# Server Configuration
SERVER_URL=http://localhost:3000
RESOURCE_URL=http://localhost:3000/mcp

# Port
PORT=3000

# External MCP Server (Proxy Configuration)
EXTERNAL_MCP_URL=http://external-mcp-server.com/sse
EXTERNAL_MCP_TOKEN=your_external_mcp_token_here
```

### 3. Configure o servidor MCP externo (opcional)

Se você tem um servidor MCP externo que usa autenticação por token, configure:

- `EXTERNAL_MCP_URL` - URL do servidor MCP externo (ex: `http://example.com/sse`)
- `EXTERNAL_MCP_TOKEN` - Token de autenticação do servidor externo

**Nota**: Se você não configurar estas variáveis, o servidor funcionará normalmente sem o proxy.

## 🏃 Executar o projeto

```bash
# desenvolvimento
pnpm run start:dev

# produção
pnpm run start:prod
```

O servidor estará disponível em: `http://localhost:3000`

## 🔌 Endpoints OAuth

- `GET /.well-known/oauth-authorization-server` - Metadata do servidor OAuth (RFC 8414)
- `GET /.well-known/oauth-protected-resource` - Metadata MCP (RFC 9728)
- `POST /auth/register` - Registro dinâmico de cliente (RFC 7591)
- `GET /auth/authorize` - Endpoint de autorização
- `GET /auth/callback` - Callback OAuth
- `POST /auth/token` - Endpoint de token
- `POST /auth/revoke` - Revogação de token

## 🧪 Testar com MCP Inspector

## MCP Inspector

1. ```bash
   npx @modelcontextprotocol/nspector
   ```

1. Configure o Inspector:
   - **Transport Type**: SSE
   - **URL**: `http://localhost:3000/sse`
   - **Connection Type**: Via Proxy
1. Clique em **Authentication** para configurar OAuth
1. Clique em **Connect**

## 🛠️ Tools Disponíveis

### Tools de Proxy (redirecionam para servidor externo):

- `proxy_list_tools` - Lista todas as ferramentas do servidor MCP externo
- `proxy_call_tool` - Chama uma ferramenta no servidor MCP externo
  - Parâmetros: `{ toolName: string, toolArgs: any }`
- `proxy_list_resources` - Lista todos os recursos do servidor MCP externo
- `proxy_read_resource` - Lê um recurso do servidor MCP externo
  - Parâmetros: `{ uri: string }`
- `proxy_list_prompts` - Lista todos os prompts do servidor MCP externo
- `proxy_get_prompt` - Obtém um prompt do servidor MCP externo
  - Parâmetros: `{ promptName: string, promptArgs?: any }`

## 🌉 Como funciona o Proxy

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Cliente   │         │  MCP Proxy       │         │  Servidor MCP   │
│  (OAuth)    │◄───────►│  (Este projeto)  │◄───────►│  Externo        │
│             │  OAuth  │                  │  Token  │  (Token Auth)   │
└─────────────┘         └──────────────────┘         └─────────────────┘
```

1. Cliente autentica via OAuth (GitHub) com seu servidor proxy
2. Seu servidor recebe requisições autenticadas
3. Seu servidor conecta ao servidor MCP externo usando token
4. Servidor externo processa e retorna os dados
5. Seu servidor retorna os dados ao cliente

## 📋 Exemplo de Uso

### Listar ferramentas do servidor externo:

```json
{
  "tool": "proxy_list_tools"
}
```

### Chamar uma ferramenta no servidor externo:

```json
{
  "tool": "proxy_call_tool",
  "args": {
    "toolName": "getUserByEmail",
    "toolArgs": {
      "email": "user@example.com"
    }
  }
}
```

## 📚 Documentação

- [MCP-Nest Documentation](https://github.com/rekog-labs/MCP-Nest)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [NestJS Documentation](https://docs.nestjs.com)

## 📝 Licença

[MIT licensed](LICENSE)

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->
