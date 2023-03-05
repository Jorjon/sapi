export default async function handler(event, context) {
  console.log({ event, context });
  const httpPath = event.requestContext.http.path;
  const httpMethod = event.requestContext.http.method.toLowerCase();

  const methodToExecuteHandler = endpointMap[httpPath]?.[httpMethod];
  if (methodToExecuteHandler == null) {
    return {
      statusCode: 400,
    };
  }

  const response = await methodToExecuteHandler();

  return {
    statusCode: response.statusCode,
    body: response.body
  };
}
