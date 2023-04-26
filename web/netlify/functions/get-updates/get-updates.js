import fetch from 'node-fetch'

export const handler = async (event, _context) => {
  const response = await fetch("https://s3-us-west-1.amazonaws.com/1wheel/?prefix=fw")
  return {
    statusCode: response.status,
    body: await response.text(),
    headers: {
      "access-control-allow-origin": "*",
    },
  }
}