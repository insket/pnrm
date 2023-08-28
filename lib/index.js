#!/usr/bin/env node

const { exec, execSync } = require("child_process");
const { program } = require("commander");
const chalk = require("chalk");
const inquirer = require("inquirer");
const { version } = require("../package.json");
const registries = require("./source.json");

/**
 *
 *   return npm registry
 */
const getOrigin = async () => {
  return await execSync("npm get registry", { encoding: "utf-8" });
};

program.version(version)

program
  .command("lists")
  .alias("ls")
  .description("look all source")
  .action(async () => {
    const res = await getOrigin();

    const keys = Object.keys(registries);

    const message = [];

    const max = Math.max(...keys.map((v) => v.length)) + 10;

    keys.forEach((k) => {
      const newK = registries[k].registry == res.trim() ? "* " + k : "  " + k;
      const Arr = new Array(...newK);
      Arr.length = max;
      const prefix = Array.from(Arr)
        .map((v) => (v ? v : "-"))
        .join("");

      message.push(prefix + "  " + registries[k].registry);
    });
    console.log(message.join("\n"));
  });

program
  .command("current")
  .alias("cur")
  .description("look at current source")
  .action(async () => {
    const res = await getOrigin();
    const cur = Object.keys(registries).find((v) => {
      if (registries[v].registry === res.trim()) {
        return v;
      }
    });

    console.log(chalk.green(`${cur}: `, res));
  });

program
  .command("use")
  .alias("u")
  .description("choose a source you want to use")
  .action(() => {
    inquirer
      .prompt([
        {
          type: "list",
          name: "select",
          message: "please choose a source you want to use",
          choices: Object.keys(registries),
        },
      ])
      .then((result) => {
        const reg = registries[result.select].registry;

        exec(`npm config set registry ${reg}`, null, (err, stdout, stderr) => {
          if (err) {
            console.log(chalk.red("switch fail😔😔"));
          } else {
            console.log(chalk.green("switch success🚀🚀"));
          }
        });
      });
  });

program.parse(process.argv);
