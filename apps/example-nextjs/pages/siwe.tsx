import { getCsrfToken, signIn } from "next-auth/react"
import { SiweMessage } from "siwe"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useNetwork, useSignMessage } from "wagmi"
import Layout from "../components/layout"

function Siwe() {
  //   const [{ data: connectData }, connectAsync] = useConnect()
  //   const [, signMessage] = useSignMessage()
  const { signMessageAsync } = useSignMessage()
  const { chain } = useNetwork()
  const { address } = useAccount()

  const handleLogin = async () => {
    try {
      const callbackUrl = "/protected"
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId: chain?.id,
        nonce: await getCsrfToken(),
      })
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })
      await signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature,
        callbackUrl,
      })
    } catch (error) {
      window.alert(error)
    }
  }

  return (
    <Layout>
      {address ? (
        <button
          onClick={(e) => {
            e.preventDefault()
            void handleLogin()
          }}
        >
          Sign-In with Ethereum
        </button>
      ) : (
        <ConnectButton />
      )}
    </Layout>
  )
}

Siwe.Layout = Layout

export default Siwe
