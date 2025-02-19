/**
 * @description Get a random port number
 * @returns {number} The random port number
 */
export function getRandomPort(): number {
  const timestamp = Date.now()
  const random = timestamp % 1000
  return 3000 + random
}

export function getRandomString(length: number = 10): string {
  return Math.random().toString(36).slice(2, 2 + length)
}
