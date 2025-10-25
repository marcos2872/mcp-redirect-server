# MCP Redirect Server

Servidor MCP (Model Context Protocol) construído com NestJS e autenticação OAuth integrada.

## 🚀 Características

- 🔐 **Autenticação OAuth 2.1** com GitHub
- 🛠️ **MCP Tools** - Exponha métodos como ferramentas MCP
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
```

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

1. Abra o navegador em: `http://localhost:3000/mcp`
2. Configure o Inspector:
   - **Transport Type**: SSE
   - **URL**: `http://localhost:3000/sse`
   - **Connection Type**: Via Proxy
3. Clique em **Authentication** para configurar OAuth
4. Clique em **Connect**

## 🛠️ Tools Disponíveis

- `getUserByEmail` - Obtém um usuário por email

## 📚 Documentação

- [MCP-Nest Documentation](https://github.com/rekog-labs/MCP-Nest)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [NestJS Documentation](https://docs.nestjs.com)

## 📝 Licença

[MIT licensed](LICENSE)

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
