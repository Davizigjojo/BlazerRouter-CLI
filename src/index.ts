#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { input, password, select } from "@inquirer/prompts";
import { loadConfig, saveConfig, clearConfig, configLocation, DEFAULT_BASE_URL } from "./config.js";
import { BlazerApi } from "./client.js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const program = new Command();

program
  .name("blazer")
  .description("CLI oficial do BlazerRouter")
  .version("0.1.0");

program.addHelpText("after", `
Exemplos:
  blazer login
  blazer models
  blazer chat --model cloudflare/@cf/meta/llama-3.1-8b-instruct-fast
  blazer test
  blazer logout

Variáveis de ambiente:
  BLAZERROUTER_API_KEY      Sobrescreve a chave salva
  BLAZERROUTER_BASE_URL     Sobrescreve a URL base
`);

program.command("login")
  .description("Configura a URL e a chave da API")
  .action(async () => {
    const current = await loadConfig();
    const baseUrl = (await input({
      message: "URL base do BlazerRouter:",
      default: current.baseUrl || DEFAULT_BASE_URL,
      validate: value => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" || "Use uma URL HTTPS.";
        } catch {
          return "Informe uma URL válida.";
        }
      }
    })).replace(/\/+$/, "");
    const apiKey = await password({
      message: "Sua chave de API (entrada oculta):",
      mask: "*",
      validate: value => value.trim().length > 0 || "A chave não pode ficar vazia."
    });
    await saveConfig({ baseUrl, apiKey: apiKey.trim() });
    console.log(chalk.green("✓ Configuração salva com permissões locais restritas."));
    console.log(chalk.gray(`Arquivo: ${configLocation()}`));
  });

program.command("logout")
  .description("Remove a chave salva localmente")
  .action(async () => {
    await clearConfig();
    console.log(chalk.green("✓ Chave local removida. A URL padrão foi mantida."));
  });

program.command("models")
  .description("Lista os modelos disponíveis na sua conta")
  .action(async () => {
    const spinner = ora("Buscando modelos...").start();
    try {
      const config = await loadConfig();
      const models = await new BlazerApi(config).listModels();
      spinner.succeed(`${models.length} modelo(s) encontrado(s)`);
      if (!models.length) return console.log(chalk.yellow("Nenhum modelo foi retornado."));
      for (const model of models) console.log(`  ${chalk.cyan(model.id)}${model.owned_by ? chalk.gray(` · ${model.owned_by}`) : ""}`);
    } catch (error) {
      spinner.fail("Não foi possível listar os modelos");
      console.error(chalk.red(error instanceof Error ? error.message : "Erro inesperado."));
      process.exitCode = 1;
    }
  });

program.command("test")
  .description("Testa a conexão com o endpoint de modelos")
  .action(async () => {
    const spinner = ora("Testando conexão...").start();
    try {
      const config = await loadConfig();
      const models = await new BlazerApi(config).listModels();
      spinner.succeed("Conexão com o BlazerRouter funcionando.");
      console.log(chalk.gray(`URL: ${config.baseUrl}`));
      console.log(chalk.gray(`Modelos visíveis: ${models.length}`));
      if (!config.apiKey) console.log(chalk.yellow("Nenhuma chave salva. Execute: blazer login"));
    } catch (error) {
      spinner.fail("Falha no teste");
      console.error(chalk.red(error instanceof Error ? error.message : "Erro inesperado."));
      process.exitCode = 1;
    }
  });

program.command("chat")
  .description("Conversa com um modelo")
  .option("-m, --model <id>", "ID do modelo")
  .option("-M, --message <text>", "Envia uma mensagem e encerra")
  .option("-s, --system <text>", "Instrução de sistema")
  .action(async (options: { model?: string; message?: string; system?: string }) => {
    try {
      const config = await loadConfig();
      if (!config.apiKey) throw new Error("Configure sua chave primeiro com: blazer login");
      const api = new BlazerApi(config);
      const spinner = ora("Carregando modelos...").start();
      const models = await api.listModels();
      spinner.stop();
      if (!models.length) throw new Error("Nenhum modelo disponível para esta conta.");
      const model = options.model || await select({
        message: "Escolha um modelo:",
        choices: models.map(item => ({ name: item.id, value: item.id }))
      });
      const history: Array<{ role: string; content: string }> = [];
      if (options.system) history.push({ role: "system", content: options.system });

      if (options.message) {
        history.push({ role: "user", content: options.message });
        const wait = ora("Pensando...").start();
        const answer = await api.chat(model, history);
        wait.stop();
        console.log(`\n${chalk.bold("BlazerRouter")} · ${chalk.cyan(model)}\n\n${answer}\n`);
        return;
      }

      console.log(chalk.green(`\nChat iniciado com ${model}. Digite /exit para sair.\n`));
      const rl = createInterface({ input: stdin, output: stdout });
      try {
        while (true) {
          const message = (await rl.question(chalk.cyan("Você › "))).trim();
          if (!message) continue;
          if (message === "/exit" || message === "/quit") break;
          history.push({ role: "user", content: message });
          const wait = ora("Pensando...").start();
          try {
            const answer = await api.chat(model, history);
            wait.stop();
            console.log(`\n${chalk.bold("Blazer")} › ${answer}\n`);
            history.push({ role: "assistant", content: answer });
          } catch (error) {
            wait.fail(error instanceof Error ? error.message : "Erro na solicitação.");
            history.pop();
          }
        }
      } finally {
        rl.close();
      }
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : "Erro inesperado."));
      process.exitCode = 1;
    }
  });

program.command("config")
  .description("Mostra informações da configuração (sem revelar a chave)")
  .action(async () => {
    const config = await loadConfig();
    console.log(`URL base: ${config.baseUrl}`);
    console.log(`Chave: ${config.apiKey ? chalk.green("configurada (oculta)") : chalk.yellow("não configurada")}`);
    console.log(`Arquivo: ${configLocation()}`);
  });

program.addCommand(new Command("help-all").description("Mostra todos os comandos").action(() => program.help()));
program.parseAsync().catch(error => {
  console.error(chalk.red(error instanceof Error ? error.message : "Erro inesperado."));
  process.exitCode = 1;
});
