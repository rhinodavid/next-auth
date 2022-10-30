import { SiweMessage } from "siwe"
import type { CommonProviderOptions } from "."
import type { RequestInternal } from "../core"
import type { User, Awaitable } from ".."

/**
 * Provider for Sign-in With Ethereum (https://login.xyz/)
 */

export interface EthereumInput {
  message: string
  signature: string
  csrfToken: string
}

export interface EthereumConfig extends CommonProviderOptions {
  type: "ethereum"
  authorize: (
    parameters: EthereumInput,
    req: Pick<RequestInternal, "body" | "query" | "headers" | "method">
  ) => Awaitable<{ id: string } | null>
}

export type EthereumProvider = (
  options: Partial<EthereumConfig>
) => EthereumConfig

export type EthereumProviderType = "Ethereum"

type UserEthereumConfig = Partial<Omit<EthereumConfig, "options" | "authorize">>

export default function Ethereum(options: UserEthereumConfig): EthereumConfig {
  return {
    id: "ethereum",
    name: "Ethereum",
    type: "ethereum",
    authorize: async (parameters: {
      message: string
      signature: string
      csrfToken: string
    }): Promise<{ id: string } | null> => {
      try {
        debugger;
        const siwe = new SiweMessage(parameters.message)
        const nextAuthUrl = process.env.NEXTAUTH_URL
        if (!nextAuthUrl) {
          return null
        }

        const nextAuthHost = new URL(nextAuthUrl).host
        if (siwe.domain !== nextAuthHost) {
          return null
        }

        if (siwe.nonce !== parameters.csrfToken) {
          return null
        }

        await siwe.validate(parameters.signature || "")

        return {
          id: siwe.address,
        }
      } catch (_e) {
        return null
      }
    },
    options,
  }
}
