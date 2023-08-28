#!/usr/bin/env node

const { exec, execSync } = require("child_process");
const { program } = require("commander");
const chalk = require("chalk");
const { version } = require("../package.json");
const registries = require("./source.json");

/**
 *
 *   return npm registry
 */
const getOrigin = async () => {
  return await execSync("npm get registry", { encoding: "utf-8" });
};

// program.version(version)

program
  .command("ls")
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

// program
//   .command("cur")
//   .description("look at current source")
//   .action(async () => {
//     const res = await getOrigin();
//     const cur = Object.keys(registries).find((v) => {
//       if (registries[v].registry === res.trim()) {
//         return v;
//       }
//     });

//     console.log(chalk.green(`${cur}: `, res));
//   });

program.parse(process.argv);
