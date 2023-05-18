# Serverless API

AWS Lambda powered API framework.

## Env Variables

| Name              | Description                 |
| ----------------- | --------------------------- |
| `SAPI_NAME`       | Name of your function       |
| `SAPI_AWS_REGION` | AWS Region of your function |

## Why

Working with an API using AWS Lambda can be difficult. There are frameworks or tools out there that help make it easier, but they are oftentimes too complicated.

For example, serverless framework is a great tool, but it's a bit too much for a simple API. You need to specify a lot of things that are not needed for a simple use case.

A code-as-configuration tool like Pulumi or Terraform are good, but you end up having a lot of boilerplate.

## What

This framework is meant to be a simple way to create an API using AWS Lambda and NodeJs.

## How to run
You need to provision your AWS Lambda Function with URL first. Then, you specify the name of the function in the `SAPI_NAME` environment variable.

**Important**: The handler for the function must be `__handler__.default`.

```shell
npm i -D sapi
```

```json
// package.json

{
  "scripts": {
    "build": "sapi build ./src",
    "up": "sapi up ./src"
  }
}
```

```javascript
// ./src/index.ts

export function get$hello_world() {
  return {
    body: JSON.stringify({
      message: "Hello World!",
    }),
    statusCode: 200,
  };
}
```

```shell
$ npm run build
> sapi build ./src

SAPI Environment variables:
SAPI_NAME: XXX
SAPI_AWS_REGION: XXX

Building 1 file...

  dist/index.mjs ────────── 510b ── 100.0%
   └ src/index.ts ───────── 379b ─── 74.3%
```
```shell
$ npm run up
> sapi up ./src

SAPI Environment variables:
SAPI_NAME: XXX
SAPI_AWS_REGION: XXX

Zipping dist folder into dist.zip...
Updating test function code...
Waiting for function update to complete...
Waiting for function update to complete...
Waiting for function update to complete...

Lambda function updated!
This action took 1863ms
```
```shell
$ curl https://YYY.lambda-url.XXX.on.aws/hello-world
{"message":"Hello World!"}
```

- Typescript is supported with esbuild, making really fast builds. Can also be combined with Javascript.
- Really simple to use, just `sapi build` and `sapi up`.
- Almost zero configuration, only specify the function name and the region.
- Uses a special syntax for methods, automatically converting them to endpoints, saving the time to add decorators or metadata.
- There's no minification, so you can debug your production code easily.
- Lightweight handler runtime, only 500 bytes.

## Limitations

- Only Node runtime is supported.
- There's no API Gateway support, and it's not planned. Only AWS Lambda with functions URLs.
- No function creation at the present, only updating an existing function.
- No support for layers.

## Roadmap

- Add function creation with automatic execution role creation if not provided.
- Provide just a simple command, `sapi up` that handles both building and deploying.
- Add a way to local test the endpoints, using something like `sapi local GET /hellow-world`.
