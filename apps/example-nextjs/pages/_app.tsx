import { SessionProvider } from "next-auth/react"
import { WagmiConfig, createClient, configureChains, chain } from "wagmi"
import {
  connectorsForWallets,
  wallet,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit"
import { publicProvider } from "wagmi/providers/public"
import "./styles.css"

import type { AppProps } from "next/app"
import type { Session } from "next-auth"

export const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.optimism, chain.arbitrum],
  [publicProvider()]
)

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      wallet.injected({ chains }),
      wallet.rainbow({ chains }),
      wallet.walletConnect({ chains }),
      wallet.metaMask({ chains }),
    ],
  },
])

const wagmiClient = createClient({
  autoConnect: true,
  provider,
  connectors,
})

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
