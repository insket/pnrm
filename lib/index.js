#!/usr/bin/env node

const { exec, execSync } = require("child_process");
const { program } = require("commander");
const chalk = require("chalk");
const inquirer = require("inquirer");
const ping = require("node-http-ping");
const { version } = require("../package.json");
const registries = require("./source.json");
const fs = require("fs");
const path = require("path");

const whiteList = ["npm", "yarn", "tencent", "cnpm", "taobao"];

/**
 *
 *   return npm registry
 */
const getOrigin = async () => {
  return await execSync("npm get registry", { encoding: "utf-8" });
};

program.version(version);

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
  .description("switch source you want to use")
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

program
  .command("ping")
  .alias("p")
  .description("test source speed")
  .action(() => {
    inquirer
      .prompt([
        {
          type: "list",
          name: "sel",
          message: "switch source",
          choices: Object.keys(registries),
        },
      ])
      .then((result) => {
        const url = registries[result.sel].ping.trim();

        ping(url)
          .then((time) => console.log(chalk.green(`response time: ${time}ms`)))
          .catch(() => console.log(chalk.red("fount error", "timeout")));
      });
  });

program
  .command("add")
  .description("add you custom source")
  .action(() => {
    inquirer
      .prompt([
        {
          type: "input",
          name: "name",
          message: "please write source name~~",
          validate(answer) {
            const keys = Object.keys(registries);
            if (keys.includes(answer)) {
              return `${answer} is exist!!`;
            }
            if (!answer.trim()) {
              return "name is required!!";
            }
            return true;
          },
        },
        {
          type: "input",
          name: "url",
          message: "please write source address~~",
          validate(answer) {
            if (!answer.trim()) {
              return `url is required`;
            }
            return true;
          },
        },
      ])
      .then((result) => {
        const del = (url) => {
          const arr = url.split("");
          return arr[arr.length - 1] == "/" ? arr.pop() && arr.join("") : arr.join("");
        };

        registries[result.name] = {
          home: result.url.trim(),
          registry: result.url.trim(),
          ping: del(result.url.trim()),
        };
        try {
          fs.writeFileSync(
            path.join(__dirname, "./source.json"),
            JSON.stringify(registries, null, 4)
          );
          console.log(chalk.green("add source success 😀😀"));
        } catch (err) {
          console.log(chalk.red(err));
        }
      });
  });

program
  .command("delete")
  .alias("d")
  .description("delete source")
  .action(
    () => {
      const keys = Object.keys(registries);
      const diff = keys.filter((key) => !whiteList.includes(key));
      if (!diff.length) {
        console.log(chalk.red("No source were found to delete"));
        return;
      }
      inquirer
        .prompt([
          {
            type: "list",
            name: "sel",
            message: "please switch you delete custom source",
            choices: diff,
          },
        ])
        .then(async (result) => {
          const current = await getOrigin();
          const selOrigin = registries[result.sel];
          if (current.trim() == selOrigin.registry.trim()) {
            console.log(
              chalk.red(
                `${registries[result.sel].registry} is using, please switch other source 🙏🙏`
              )
            );
          } else {
            try {
              delete registries[result.sel];

              fs.writeFileSync(
                path.join(__dirname, "./source.json"),
                JSON.stringify(registries, null, 4)
              );

              console.log(chalk.green("delete success 🚀🚀"));
            } catch (e) {
              console.log(chalk.red(err));
            }
          }
        });
    }
    // }
  );

program.parse(process.argv);
