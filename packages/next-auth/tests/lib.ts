import { createHash } from "crypto"
import { NextAuthHandler } from "../src/core"
import type { LoggerInstance, NextAuthOptions } from "../src"
import type { Adapter } from "../src/adapters"

export const mockLogger: () => LoggerInstance = () => ({
  error: jest.fn(() => {}),
  warn: jest.fn(() => {}),
  debug: jest.fn(() => {}),
})

interface HandlerOptions {
  prod?: boolean
  path?: string
  params?: URLSearchParams | Record<string, string>
  requestInit?: RequestInit
}

export async function handler(
  options: NextAuthOptions,
  { prod, path, params, requestInit }: HandlerOptions
) {
  // @ts-expect-error
  if (prod) process.env.NODE_ENV = "production"

  const url = new URL(
    `http://localhost/api/auth/${path ?? "signin"}?${new URLSearchParams(
      params ?? {}
    )}`
  )
  const req = new Request(url, { headers: { host: "" }, ...requestInit })
  const logger = mockLogger()
  const response = await NextAuthHandler({
    req,
    options: { secret: "secret", ...options, logger },
  })
  // @ts-expect-error
  if (prod) process.env.NODE_ENV = "test"

  return {
    res: {
      ...response,
      html:
        response.headers?.[0].value === "text/html" ? response.body : undefined,
    },
    log: logger,
  }
}

export function createCSRF(value: string = "csrf", secret: string = "secret") {
  const token = createHash("sha256").update(`${value}${secret}`).digest("hex")

  return {
    secret,
    csrf: { value, token, cookie: `next-auth.csrf-token=${value}|${token}` },
  }
}

export function mockAdapter(): Adapter {
  const adapter: Adapter = {
    createSession: jest.fn(() => {}),
    createUser: jest.fn(() => {}),
    createVerificationToken: jest.fn(() => {}),
    linkAccount: jest.fn(() => {}),
    useVerificationToken: jest.fn(() => {}),
    getUserByAccount: jest.fn(() => {}),
    getUserByEmail: jest.fn(() => {}),
  }
  return adapter
}
