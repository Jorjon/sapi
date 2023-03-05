export function get$ping() {
  return {
    body: JSON.stringify({
      message: "Pong!",
    }),
    statusCode: 200,
  };
}
