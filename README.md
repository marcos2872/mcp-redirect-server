# MCP Transparent Proxy Server

Servidor MCP (Model Context Protocol) que atua como um **proxy transparente** entre sistemas OAuth e servidores MCP com autenticação simples. O proxy é **invisível** para a IA - tools, resources e prompts do servidor externo aparecem como se fossem nativos.

## 🎯 Objetivo

Este servidor resolve o problema de incompatibilidade de autenticação entre:

- **Cliente/IA** → Requer autenticação OAuth (GitHub)
- **Servidor MCP Externo** → Usa autenticação simples (token/API key)

**Fluxo:**

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Cliente   │         │  MCP Proxy       │         │  Servidor MCP   │
│  (OAuth)    │◄───────►│  (Este projeto)  │◄───────►│  Externo        │
│             │  OAuth  │                  │  Token  │  (Token Auth)   │
└─────────────┘         └──────────────────┘         └─────────────────┘
```

## 🚀 Características

- 🔐 **Autenticação OAuth 2.1** com GitHub no frontend
- 🌉 **Proxy Transparente** - IA não vê o proxy, apenas as tools/resources/prompts reais
- � **Auto-Discovery** - Descobre e registra automaticamente tools, resources e prompts
- 🛠️ **Dynamic Tools** - Tools do servidor externo aparecem como nativas
- 📁 **Dynamic Resources** - Resources do servidor externo são expostos diretamente
- 💬 **Dynamic Prompts** - Prompts do servidor externo são mapeados automaticamente
- 🔑 **Token Authentication** - Conecta ao servidor externo via token/API key
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

### 3. Configure o servidor MCP externo

Para que o proxy funcione, configure as variáveis do servidor externo:

- `EXTERNAL_MCP_URL` - URL do servidor MCP externo (ex: `http://example.com/sse`)
- `EXTERNAL_MCP_TOKEN` - Token de autenticação do servidor externo

**Exemplo:**

```env
EXTERNAL_MCP_URL=http://localhost:3001/api/sse
EXTERNAL_MCP_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nota**: Se você não configurar estas variáveis, o servidor funcionará apenas com OAuth sem proxy.

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

## 🛠️ Tools/Resources/Prompts Disponíveis

### **Auto-descobertos do servidor externo:**

O proxy **automaticamente descobre e registra** todos os itens do servidor MCP externo:

- **Tools** → Aparecem com seus nomes reais (ex: `listUsers`, `createUser`)
- **Resources** → Expostos com URIs reais (ex: `file://data.json`, `db://users`)
- **Prompts** → Mapeados com nomes reais (ex: `generateReport`, `analyzeData`)

### **Logs de inicialização:**

```
[DynamicToolsService] Loaded 6 external tools: listUsers, createUser, getUser, updateUser, deleteUser, getUserStats
[DynamicToolsService] Loaded 3 external resources: file://data.json, db://users, config://app.yaml
[DynamicToolsService] Loaded 2 external prompts: generateReport, analyzeData
```

### **Uso direto:**

A IA pode chamar qualquer item descoberto como se fosse nativo:

- `listUsers()` - Lista usuários
- `createUser({name: "João"})` - Cria usuário
- Ler `file://data.json` - Acessa arquivo
- Executar `generateReport` - Gera relatório

**Sem prefixos, sem proxy manual, sem complexidade!** ✨

## 🧪 Testar com MCP Inspector

1. Abra o navegador em: `http://localhost:3000/mcp`
2. Configure o Inspector:
   - **Transport Type**: SSE
   - **URL**: `http://localhost:3000/sse`
   - **Connection Type**: Via Proxy
3. Clique em **Authentication** para configurar OAuth
4. Clique em **Connect**

### **O que você verá:**

- **Tools**: `listUsers`, `createUser`, etc. (não `proxy_*`)
- **Resources**: `file://data.json`, `db://users`, etc.
- **Prompts**: `generateReport`, `analyzeData`, etc.

### **Para testar:**

1. **Liste tools** → Vê as tools do servidor externo como nativas
2. **Chame tool** → `listUsers` (sem `proxy_call_tool`)
3. **Acesse resource** → Leia `file://data.json` diretamente
4. **Execute prompt** → `generateReport` como se fosse local

**A IA não sabe que existe um proxy!** 🎭

## 🛠️ Como funciona o Proxy Transparente

### **Auto-Discovery na Inicialização:**

1. **Conecta** ao servidor MCP externo via token
2. **Descobre** todas as tools, resources e prompts disponíveis
3. **Registra dinamicamente** cada item como se fosse nativo
4. **Aplica decoradores** `@Tool`, `@Resource`, `@Prompt` automaticamente

### **Para a IA (Cliente):**

- ✅ Vê `listUsers`, `createUser`, `getReport` (tools reais)
- ✅ Vê `file://data.json`, `db://users` (resources reais)
- ✅ Vê `generateReport`, `analyzeData` (prompts reais)
- ❌ **NÃO vê** `proxy_*` ou qualquer indicação de proxy

### **Redirecionamento Automático:**

- **Tool Call** `listUsers()` → Redireciona para servidor externo
- **Resource Read** `file://data.json` → Busca no servidor externo
- **Prompt Get** `generateReport` → Executa no servidor externo

## 🎭 Transparência Total

A IA interage com o servidor como se fosse **direto**, sem saber da existência do proxy:

```
IA pensa:    "Vou chamar a tool 'listUsers'"
Realidade:   OAuth → Proxy → Token → Servidor Externo → Resposta → Proxy → IA
IA recebe:   Lista de usuários (como se fosse direto)
```

## 📋 Exemplo de Uso

### **Antes (com proxy manual):**

```json
{
  "tool": "proxy_call_tool",
  "args": {
    "toolName": "listUsers",
    "toolArgs": {}
  }
}
```

### **Agora (transparente):**

```json
{
  "tool": "listUsers"
}
```

A IA simplesmente chama `listUsers` como se fosse uma tool nativa! 🎉

## 📚 Documentação

### **Conceitos principais:**

- **Proxy Transparente**: IA não vê o proxy, apenas tools/resources/prompts reais
- **Auto-Discovery**: Sistema descobre automaticamente itens do servidor externo
- **Dynamic Registration**: Items são registrados dinamicamente como nativos
- **OAuth Bridge**: Converte autenticação OAuth para token simples

### **Links úteis:**

- [MCP-Nest Documentation](https://github.com/rekog-labs/MCP-Nest)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [NestJS Documentation](https://docs.nestjs.com)
- [OAuth 2.1 Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)

## 🚀 Benefícios

### **Para Desenvolvedores:**

- ✅ Reutiliza servidores MCP existentes sem modificações
- ✅ Adiciona OAuth a qualquer servidor MCP
- ✅ Zero configuração manual de tools/resources/prompts
- ✅ Logs detalhados de descoberta e redirecionamento

### **Para IAs:**

- ✅ Interface simples e direta (sem `proxy_*`)
- ✅ Tools/resources/prompts aparecem como nativos
- ✅ Schemas corretos e validação automática
- ✅ Experiência transparente

### **Para Sistemas:**

- ✅ Bridge entre autenticações incompatíveis
- ✅ Segurança OAuth no frontend
- ✅ Flexibilidade de token no backend
- ✅ Escalabilidade e performance

## 📝 Licença

[MIT licensed](LICENSE)

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->
