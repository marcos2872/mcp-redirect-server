# MCP Transparent Proxy Server

Servidor MCP (Model Context Protocol) que atua como um **proxy transparente** entre sistemas OAuth e servidores MCP com autenticação simples. O proxy é **invisível** para a IA - tools, resources e prompts do servidor externo aparecem como se fossem nativos.

## 🎯 Objetivo

Este servidor atua como um **bridge duplo de autenticação**, resolvendo dois problemas de incompatibilidade:

1. **Cliente → Este Servidor**: Autenticação OAuth 2.1 com GitHub
2. **Este Servidor → MCP Externo**: Autenticação via API (email/senha → Bearer token)

**Fluxo Completo:**

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Cliente   │         │  MCP Proxy       │         │  Servidor MCP   │
│     MCP     │◄───────►│  (Este projeto)  │◄───────►│  Externo        │
│             │  OAuth  │                  │ Bearer  │  (API Login)    │
│  GitHub     │  2.1    │  OAuth + API     │  Token  │  Email/Pass     │
└─────────────┘         └──────────────────┘         └─────────────────┘
```

## 🚀 Características

### Autenticação Dupla:

- 🔐 **OAuth 2.1 com GitHub** - Cliente autentica via OAuth no frontend
- 🔑 **API Login Automático** - Servidor faz login automático na API externa (email/senha)
- 🎫 **Bearer Token Management** - Gerencia tokens automaticamente para o servidor MCP externo
- 🔄 **Auto Refresh Token** - Renova tokens expirados automaticamente
- ⏱️ **Token Caching** - Cache inteligente de tokens com validação de expiração

### Proxy Features:

- 🌉 **Bridge Transparente** - Conecta diferentes tipos de autenticação
- 🛠️ **Proxy Tools** - 6 ferramentas para acessar servidor MCP externo
- 📡 **SSE Transport** - Server-Sent Events para comunicação em tempo real
- 🔄 **Auto-Reconnect** - Reconexão automática em caso de falha de autenticação
- 🔒 **JWT Security** - Proteção de rotas com JWT
- 💉 **Dependency Injection** - Sistema DI completo do NestJS
- 📝 **Logs Detalhados** - Monitoramento completo de autenticação e proxy
- 🛡️ **Error Recovery** - Recuperação automática de erros de token expirado

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
# OAuth Provider (GitHub) - Para autenticação do cliente
GITHUB_CLIENT_ID=seu_client_id_aqui
GITHUB_CLIENT_SECRET=seu_client_secret_aqui

# JWT Configuration (mínimo 32 caracteres)
JWT_SECRET=my-super-secure-jwt-secret-key-with-at-least-32-characters

# Server Configuration
SERVER_URL=http://localhost:3000
RESOURCE_URL=http://localhost:3000/sse

# Port
PORT=3000

# External API Authentication - Para autenticação no servidor MCP externo
EXTERNAL_API_LOGIN_URL=https://api-externa.com/auth/login
EXTERNAL_API_USER=seu_email@example.com
EXTERNAL_API_PASSWORD=sua_senha_segura

# External MCP Server - URL SSE do servidor MCP externo
EXTERNAL_MCP_URL=https://api-externa.com/sse
```

### 3. Descrição das Variáveis

#### Autenticação do Cliente (OAuth GitHub):

- `GITHUB_CLIENT_ID` - Client ID do OAuth App do GitHub
- `GITHUB_CLIENT_SECRET` - Client Secret do OAuth App do GitHub
- `JWT_SECRET` - Chave secreta para JWT (mínimo 32 caracteres)

#### Autenticação no Servidor Externo (API Login):

- `EXTERNAL_API_LOGIN_URL` - URL da API de login do servidor externo
  - Exemplo: `https://meuservidor.com/auth/login`
  - O servidor fará POST com `{ email, password }` nesta URL
- `EXTERNAL_API_USER` - Email/usuário para autenticação na API externa
- `EXTERNAL_API_PASSWORD` - Senha para autenticação na API externa

#### Configuração do Proxy MCP:

- `EXTERNAL_MCP_URL` - URL SSE do servidor MCP externo
  - Exemplo: `https://meuservidor.com/sse`
  - Deve ser o endpoint SSE que implementa o protocolo MCP

**Importante**:

- O servidor faz login automático na `EXTERNAL_API_LOGIN_URL` usando email/senha
- A resposta deve conter um campo `token` ou `access_token`
- Opcionalmente, pode conter `expires_in` (tempo de expiração em segundos)
- Se `expires_in` não for fornecido, assume-se 1 hora de validade
- Este token é usado como Bearer token nas requisições para `EXTERNAL_MCP_URL`
- O token é automaticamente renovado quando próximo da expiração (5 minutos antes)

## 🏃 Executar o projeto

```bash
# desenvolvimento
pnpm run start:dev

# produção
pnpm run start:prod
```

O servidor estará disponível em: `http://localhost:3000`

## 🔌 Endpoints

### Endpoints OAuth (Cliente):

- `GET /.well-known/oauth-authorization-server` - Metadata do servidor OAuth (RFC 8414)
- `GET /.well-known/oauth-protected-resource` - Metadata MCP (RFC 9728)
- `POST /auth/register` - Registro dinâmico de cliente (RFC 7591)
- `GET /auth/authorize` - Endpoint de autorização OAuth
- `GET /auth/callback` - Callback OAuth do GitHub
- `POST /auth/token` - Endpoint de token OAuth
- `POST /auth/revoke` - Revogação de token OAuth

### Endpoint MCP:

- `GET /sse` - Endpoint SSE para conexão MCP (requer autenticação OAuth)

## 🧪 Testar com MCP Inspector

1. Abra o navegador em: `http://localhost:3000/mcp`
2. Configure o Inspector:
   - **Transport Type**: SSE
   - **URL**: `http://localhost:3000/sse`
   - **Connection Type**: Via Proxy
3. Clique em **Authentication** para configurar OAuth
4. Clique em **Connect**

**A Client não sabe que existe um proxy!** 🎭

## � Como Funciona

### **Fluxo de Autenticação Dupla:**

#### 1. Cliente se autentica no Proxy (OAuth GitHub):

```
Cliente → GET /auth/authorize
       → Redireciona para GitHub
       → Usuário autoriza
       → GET /auth/callback
       → Recebe JWT token
```

#### 2. Proxy se autentica no Servidor Externo (API Login):

```
Proxy → POST EXTERNAL_API_LOGIN_URL
      → Body: { email: USER, password: PASS }
      → Recebe: { token: "Bearer..." }
      → Armazena token
```

#### 3. Cliente usa o Proxy com proxy tools:

```
Cliente → callTool('proxy_list_tools') com JWT
Proxy   → Valida JWT do cliente
Proxy   → Conecta ao servidor externo com Bearer token
Proxy   → client.listTools() via SSE
Servidor Externo → Retorna lista de tools
Proxy   → Retorna resposta ao cliente
```

### **Fluxo Completo de uma Chamada:**

```
┌─────────┐  1. OAuth JWT    ┌───────────┐  2. Bearer Token  ┌──────────┐
│ Cliente │ ───────────────→ │   Proxy   │ ─────────────────→│ Servidor │
│   MCP   │                  │   Server  │                   │  Externo │
│         │ ←─────────────── │           │ ←──────────────── │   MCP    │
└─────────┘  4. Resposta     └───────────┘  3. Resposta      └──────────┘
```

### **Inicialização Automática:**

Quando o servidor inicia:

1. ✅ Configura OAuth com GitHub para clientes
2. ✅ Faz login automático na API externa
3. ✅ Armazena o token com informações de expiração
4. ✅ Conecta ao servidor MCP externo via SSE com Bearer token
5. ✅ Registra as proxy tools
6. ✅ Fica pronto para aceitar conexões de clientes

### **Sistema de Refresh Token:**

O servidor implementa um sistema inteligente de gerenciamento de tokens:

#### Cache de Token:

```
┌──────────────────────────────────────────────────────┐
│ Token armazenado em memória com timestamp           │
│ Validade: expires_in - 5 minutos (margem segurança) │
│ Reutilizado enquanto válido (evita logins extras)   │
└──────────────────────────────────────────────────────┘
```

#### Renovação Automática:

```
1️⃣ Antes de cada operação MCP
   → Verifica se token está próximo de expirar
   → Se sim, renova automaticamente

2️⃣ Em caso de erro de autenticação (401/403)
   → Detecta erro de autenticação
   → Força refresh do token
   → Reconecta com novo token
   → Retenta operação automaticamente
```

#### Fluxo de Refresh:

```
Operação MCP solicitada
    ↓
Verifica expiração do token
    ↓
Token válido? ─── NÃO ──→ POST /auth/login
    │                         ↓
   SIM                   Novo token + expires_in
    ↓                         ↓
Usa token em cache      Atualiza cache
    ↓                         ↓
    └──────────→ Executa operação MCP
                        ↓
                  Erro 401/403? ─── SIM ──→ Força refresh
                        │                         ↓
                       NÃO                  Reconecta cliente
                        ↓                         ↓
                  Retorna resultado         Retenta operação
```

#### Benefícios do Sistema:

- ✅ **Zero Downtime**: Tokens renovados antes de expirar
- ✅ **Recuperação Automática**: Erros de autenticação tratados automaticamente
- ✅ **Performance**: Cache evita logins desnecessários
- ✅ **Transparente**: Cliente não percebe renovações
- ✅ **Resiliente**: Reconexão automática em falhas

## 📚 Documentação

### **Conceitos principais:**

- **Double Authentication Bridge**: Ponte entre OAuth (cliente) e API Login (servidor externo)
- **Proxy Tools**: ferramentas para acessar servidor MCP externo de forma controlada
- **Token Management**: Gerenciamento automático de JWT (cliente) e Bearer tokens (servidor)
- **Auto Refresh Token**: Sistema inteligente que renova tokens antes de expirar
- **Token Caching**: Cache de tokens com validação de expiração para melhor performance
- **Error Recovery**: Recuperação automática de erros de autenticação com retry
- **SSE Transport**: Comunicação em tempo real via Server-Sent Events

### **Links úteis:**

- [MCP-Nest Documentation](https://github.com/rekog-labs/MCP-Nest)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [NestJS Documentation](https://docs.nestjs.com)
- [OAuth 2.1 Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

## 🚀 Benefícios

- ✅ **Bridge Duplo**: Conecta OAuth (cliente) com API Login (servidor externo)
- ✅ **Sem Modificação**: Usa servidores MCP existentes sem mudanças
- ✅ **Segurança em Camadas**: OAuth no frontend + Bearer token no backend
- ✅ **Gerenciamento Automático**: Tokens gerenciados e renovados automaticamente
- ✅ **Zero Downtime**: Renovação preventiva de tokens antes da expiração
- ✅ **Resiliente**: Recuperação automática de falhas de autenticação
- ✅ **Performance Otimizada**: Cache de tokens evita logins desnecessários
- ✅ **Isolamento de Credenciais**: Servidor externo nunca vê credenciais OAuth
- ✅ **Logs Detalhados**: Monitoramento completo de autenticação e proxy
- ✅ **Produção-Ready**: Implementação completa do protocolo MCP
- ✅ **Flexível**: Fácil configuração via variáveis de ambiente

## 🔒 Segurança

- ✅ **OAuth 2.1**: Autenticação segura de clientes via GitHub
- ✅ **JWT Tokens**: Tokens assinados e validados
- ✅ **Credenciais Isoladas**: Senhas apenas em variáveis de ambiente
- ✅ **Logs Sanitizados**: Senhas nunca aparecem nos logs
- ✅ **Bearer Tokens**: Comunicação segura com servidor externo
- ✅ **Token Rotation**: Renovação automática de tokens para segurança contínua
- ✅ **Margem de Segurança**: Tokens renovados 5 minutos antes de expirar
- ✅ **HTTPS Ready**: Preparado para produção com HTTPS

## 🎯 Formato de Resposta da API Externa

A API externa (`EXTERNAL_API_LOGIN_URL`) deve retornar uma resposta JSON no seguinte formato:

### Resposta Mínima:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

ou

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Resposta Recomendada (com expiração):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

**Campos suportados:**

- `token` ou `access_token` (string, obrigatório) - Bearer token para autenticação
- `expires_in` (number, opcional) - Tempo de expiração em segundos (padrão: 3600)

**Comportamento:**

- Se `expires_in` for fornecido, o servidor usa esse valor
- Caso contrário, assume 1 hora (3600 segundos) de validade
- Token é renovado automaticamente 5 minutos antes de expirar

## 🛠️ Troubleshooting

### Erro: "Authentication configuration is incomplete"

Verifique se todas as variáveis estão no `.env`:

- `EXTERNAL_API_LOGIN_URL`
- `EXTERNAL_API_USER`
- `EXTERNAL_API_PASSWORD`

### Erro: "Failed to authenticate"

- Confirme que a URL de login está correta
- Verifique se email/senha são válidos
- Confirme que a API retorna `token` ou `access_token`

### Erro: "EXTERNAL_MCP_URL not configured"

Configure `EXTERNAL_MCP_URL` no `.env` com a URL SSE do servidor externo.

### Cliente não consegue conectar via OAuth

- Verifique `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`
- Confirme que a callback URL no GitHub está correta: `http://localhost:3000/auth/callback`
- Verifique se `JWT_SECRET` tem pelo menos 32 caracteres

### Token expira muito rápido

- Verifique se a API externa retorna `expires_in` correto
- O servidor renova tokens 5 minutos antes de expirar
- Confira os logs para ver quando tokens estão sendo renovados
- Logs de exemplo:
  ```
  [McpProxyService] Refreshing authentication token...
  [McpProxyService] Token refreshed successfully. Expires in 3600s
  [McpProxyService] Using cached token
  ```

### Erro: "MCP client is not connected"

- O servidor tenta reconectar automaticamente
- Verifique se `EXTERNAL_MCP_URL` está acessível
- Confira logs de erro de conexão
- Sistema tentará reconectar na próxima operação

### Erro 401/403 do servidor externo

- Sistema detecta automaticamente e força refresh do token
- Se persistir, verifique credenciais `EXTERNAL_API_USER` e `EXTERNAL_API_PASSWORD`
- Confirme que a API de login está funcionando corretamente

## 📝 Licença

[MIT licensed](LICENSE)

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->
