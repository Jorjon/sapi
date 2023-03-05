import archiver from "archiver";
import fs from "node:fs";
import chalk from "chalk";
import {
  LambdaClient,
  UpdateFunctionCodeCommand,
  GetFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";

const log = console.log;

// @TODO use in-memory writable stream
function zipFolder(folder, outfile) {
  // const output = new Writable;
  const output = fs.createWriteStream(outfile);
  const archive = archiver("zip", {
    zlib: { level: 8 },
  });
  archive.pipe(output);
  archive.directory(folder, false);
  archive.finalize();
  return new Promise<void>((resolve) => {
    output.on("close", () => {
      resolve();
    });
  });
}

async function waitForFunctionUpdate(client, functionName, timeout) {
  const waitStart = Date.now();
  let success = false;
  let response;

  while (!success && Date.now() - waitStart < timeout) {
    const getFunctionConfigurationCommand = new GetFunctionConfigurationCommand(
      {
        FunctionName: functionName,
      }
    );
    response = await client.send(getFunctionConfigurationCommand);
    success = response.LastUpdateStatus === "Successful";
    if (!success) {
      log("Waiting for function update to complete...");
    }
  }

  return [success, response];
}

export default async function up() {
  const startProcessTime = Date.now();
  const client = new LambdaClient({ region: process.env.SAPI_AWS_REGION });

  const functionName = process.env.SAPI_NAME;

  const PACKAGE_FILE = "dist.zip";
  const DIST_FOLDER = "dist";

  log(
    `Zipping ${chalk.yellow(DIST_FOLDER)} folder into ${chalk.yellow(
      PACKAGE_FILE
    )}...`
  );
  await zipFolder(DIST_FOLDER, PACKAGE_FILE);
  const zipFileBuffer = fs.readFileSync(PACKAGE_FILE);

  const params = {
    FunctionName: functionName,
    ZipFile: zipFileBuffer,
  };
  try {
    const updateFunctionCodeCommand = new UpdateFunctionCodeCommand(params);
    await client.send(updateFunctionCodeCommand);
    log(`Updating ${chalk.yellow(functionName)} function code...`);
  } catch (error) {
    log(error);
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const TIMEOUT = 5000;
  const [success, lastResponse] = await waitForFunctionUpdate(
    client,
    functionName,
    TIMEOUT
  );
  if (!success) {
    log(
      chalk.red(
        `After ${
          (TIMEOUT / 1000) | 0
        } seconds, Lambda LastUpdateStatus still not Successful:`
      )
    );
    log(lastResponse);
    return;
  }

  const deltaTime = Date.now() - startProcessTime;
  log(`
${chalk.green("Lambda function updated!")}\nThis action took ${chalk.yellow(
    `${deltaTime}ms`
  )}`);
}
