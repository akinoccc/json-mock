/**
 * @description Get a random port number
 * @returns {number} The random port number
 */
export function getRandomPort() {
  const timestamp = Date.now()
  const random = timestamp % 1000
  return 3000 + random
}
