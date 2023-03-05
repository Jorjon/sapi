// Gets converted to GET /hello-world
export function get$hello_world() {
  return {
    body: JSON.stringify({
      message: "Hello World!",
    }),
    statusCode: 200,
  };
}

// Gets converted to POST /delay
export async function post$delay() {
  const waitStart = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    body: JSON.stringify({
      message: `Waited ${Date.now() - waitStart}ms`,
    }),
    statusCode: 200,
  };
}
