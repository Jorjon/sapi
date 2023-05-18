#!/usr/bin/env node
import chalk from "chalk";

const log = console.log;

import dotenv from "dotenv";
dotenv.config();

if (process.env.SAPI_NAME == null || process.env.SAPI_AWS_REGION == null) {
  throw new Error(
    chalk.red("SAPI_NAME or SAPI_AWS_REGION env not set. Please read README.md")
  );
  process.exit(1);
}

log("SAPI Environment variables:");
log(chalk.yellow("SAPI_NAME:"), process.env.SAPI_NAME);
log(chalk.yellow("SAPI_AWS_REGION:"), process.env.SAPI_AWS_REGION);
log("")

const [nodePath, sapiPath, command, ...args] = process.argv;

if (command !== "up" && command !== "build") {
  log(chalk.red("[ERROR]"), "Unknown command", chalk.yellow(command));
  log(`Usage: sapi [up|build]`);
  process.exit();
}

import * as up from "./up/up.js";
import * as build from "./build/build.js";

if (command === "up") {
  await up.default();
} else if (command === "build") {
  const inputFolder = args[0];
  if (inputFolder == null || inputFolder === "") {
    log(chalk.red("[ERROR]"), "Please specify input folder");
    log(`Usage: sapi build [inputFolder]`);
    process.exit();
  }
  await build.default(inputFolder);
}
