import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import chalk from "chalk";

function transformHttpEndpointToMethodName(
  httpMethod: string,
  httpEndpoint: string
) {
  const httpMethodNameWithoutInitialSlash = httpEndpoint.replace(/^\//, "");
  return `${httpMethod.toLowerCase()}$${httpMethodNameWithoutInitialSlash.replaceAll(
    "-",
    "_"
  )}`;
}

function transformMethodNameToHttpEndpoint(methodName: string) {
  if (!methodName.includes("$")) {
    throw new Error(`Method is not an endpoint: ${methodName}`);
  }
  const [httpMethod, httpEndpoint] = methodName.split("$");
  return [httpMethod, `/${httpEndpoint.replaceAll("_", "-")}`];
}

function prepareInputFileName(inputFolder: string, inputFileName: string) {
  const relativeFile = path.relative(inputFolder, inputFileName);
  return relativeFile;
}
function normalizeFileNameToVariableName(fileName: string) {
  return fileName
    .replaceAll("-", "_")
    .replaceAll(".", "_")
    .replaceAll("/", "_");
}

function walkDir(dir: string, callback: (file: string) => void) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  }
}

const log = console.log;

export default async function build(inputFolder) {
  const inputFiles: string[] = [];
  const outputFolder = "dist";
  walkDir(inputFolder, (file) => {
    if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".mjs")) {
      inputFiles.push(file);
    }
  });

  log(`Building ${chalk.yellow(inputFiles.length)} files...`);

  const dirName = path.dirname(fileURLToPath(import.meta.url));
  const inputHandlerFileName = path.join(dirName, "__handler__.mjs");
  const targetHandlerFileName = `${outputFolder}/__handler__.mjs`;

  const result = await esbuild.build({
    entryPoints: [...inputFiles],
    loader: {
      ".ts": "ts",
    },
    banner: {
      js: `// This file is generated by sapi + esbuild. Do not edit it directly.`,
    },
    outExtension: {
      ".js": ".mjs",
    },
    target: "node18",
    platform: "node",
    format: "esm",
    bundle: true,
    outdir: outputFolder,
    allowOverwrite: true,
    write: true,
    metafile: true,
    treeShaking: true,
  });


  console.log(
    await esbuild.analyzeMetafile(result.metafile, {
      verbose: true,
    })
  );

  fs.copyFileSync(inputHandlerFileName, targetHandlerFileName);

  const hashHttpMethods = {};
  const outputFiles = Object.keys(result.metafile.outputs);

  for (const outputFile of outputFiles) {
    const moduleFile = path.join(process.cwd(), outputFile);
    const module = await import(moduleFile);
    const moduleMethodNames = Object.keys(module);
    for (const methodName of moduleMethodNames) {
      try {
        const [httpMethod, httpEndpoint] =
          transformMethodNameToHttpEndpoint(methodName);
        if (hashHttpMethods[httpEndpoint] == null) {
          hashHttpMethods[httpEndpoint] = {};
        }
        const inputFileRelativeToDist = prepareInputFileName(
          outputFolder,
          outputFile
        );
        hashHttpMethods[httpEndpoint][httpMethod] = {
          methodName,
          fileName: normalizeFileNameToVariableName(inputFileRelativeToDist),
        };
      } catch (error) {
        // Ignore
      }
    }
  }

  const fileImportBuffer = `${outputFiles
    .map((outputFile) => {
      const inputFileRelativeToDist = prepareInputFileName(
        outputFolder,
        outputFile
      );
      return `import * as ${normalizeFileNameToVariableName(
        inputFileRelativeToDist
      )} from "./${inputFileRelativeToDist}";`;
    })
    .join("\n")}`;

  const endpointMapBuffer = `const endpointMap = {\n${Object.entries(
    hashHttpMethods
  )
    .map(([httpEndpoint, hashHttpMethods]) => {
      return `  "${httpEndpoint}": {\n${Object.entries(hashHttpMethods)
        .map(([httpMethod, { methodName, fileName }]) => {
          return `    ${httpMethod}: ${fileName}.${methodName},`;
        })
        .join("\n")}\n  },`;
    })
    .join("\n")}\n};\n`;

  const buffer = `${fileImportBuffer}\n${endpointMapBuffer}`;

  fs.appendFileSync(targetHandlerFileName, buffer);

  log(chalk.green("Done!"))
}
