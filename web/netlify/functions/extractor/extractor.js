import fetch from 'node-fetch'

export const handler = async (event, _context) => {
  const generation = event.queryStringParameters.generation
  const response = await fetch(
    `/${generation}-signed-extractor.bin`)
  const encodedFirmware = btoa(String.fromCharCode(...new Uint8Array(await response.arrayBuffer())));
  return {
    statusCode: 200,
    body: encodedFirmware,
    isBase64Encoded: true,
    headers: {
      "access-control-allow-origin": "*",
    },
  }
}
