# BlazerRouter CLI

CLI oficial para usar o [BlazerRouter](https://blazerrouter.davirediske.workers.dev) diretamente no terminal.

> **Status:** versão inicial de desenvolvimento (0.1.0). O projeto ainda não foi publicado no npm.

## Requisitos

- Node.js 20 ou superior
- Uma chave de API do BlazerRouter

## Desenvolvimento

```bash
git clone https://github.com/Davizigjojo/BlazerRouter-CLI.git
cd BlazerRouter-CLI
npm install
npm run typecheck
npm test
npm run build
node dist/index.js --help
```

## Configuração

Depois de instalar ou executar o CLI:

```bash
blazer login
```

O comando solicita a URL base e a chave com entrada oculta. Por padrão, a URL é:

```
https://blazerrouter.davirediske.workers.dev
```

A configuração fica em `~/.blazerrouter/config.json`. Em sistemas compatíveis, a pasta recebe permissão `0700` e o arquivo `0600`. A chave nunca é impressa pelo comando `config`.

Também é possível usar variáveis de ambiente:

- `BLAZERROUTER_API_KEY`
- `BLAZERROUTER_BASE_URL`

As variáveis de ambiente têm prioridade sobre o arquivo local.

## Comandos

| Comando | Função |
|---|---|
| `blazer login` | Configura URL e chave |
| `blazer logout` | Remove a chave salva |
| `blazer models` | Lista modelos disponíveis |
| `blazer chat` | Inicia conversa interativa |
| `blazer chat -m ID -M "Olá"` | Envia uma mensagem direta |
| `blazer test` | Testa o endpoint de modelos |
| `blazer config` | Exibe configuração sem revelar a chave |
| `blazer --help` | Ajuda |

## Exemplos

```bash
blazer login
blazer models
blazer chat
blazer chat --model "cloudflare/@cf/meta/llama-3.1-8b-instruct-fast"
blazer chat --model "cloudflare/@cf/meta/llama-3.1-8b-instruct-fast" --message "Olá!"
blazer test
```

## Compatibilidade

O projeto usa Node.js e APIs padrão, sem dependências nativas. A intenção é suportar Windows, Linux, macOS e Termux (Android) com Node.js 20+.

## Segurança

- Não coloque chaves em argumentos de linha de comando.
- Não compartilhe o arquivo `~/.blazerrouter/config.json`.
- Não envie chaves em issues, prints ou logs.
- Use variáveis de ambiente em automações e ambientes compartilhados.
- O arquivo de configuração usa permissões restritas em sistemas POSIX; isso não substitui um gerenciador de segredos do sistema.

## Endpoints utilizados

O CLI usa os endpoints compatíveis com OpenAI:

- `GET /v1/models`
- `POST /v1/chat/completions`

A implementação assume que o Worker BlazerRouter disponibiliza esses caminhos.

## Licença

MIT.
