import { createCSRF, handler, mockAdapter } from "./lib"
import EthereumProvider from "../src/providers/ethereum"
import { SiweMessage } from "siwe"
import { ethers } from "ethers"
debugger;
/**
 *
 */
it("redirects on an invalid signature", async () => {
  const { secret, csrf } = await createCSRF()
  const signIn = jest.fn(() => true)

  const ethereumProvider = EthereumProvider({})
  const authorizeSpy = jest.spyOn(ethereumProvider, "authorize")

  const { res } = await handler(
    {
      adapter: mockAdapter(),
      providers: [ethereumProvider],
      callbacks: { signIn },
      secret,
    },
    {
      path: "callback/ethereum",
      requestInit: {
        method: "POST",
        headers: { cookie: csrf.cookie },
        body: JSON.stringify({
          message: "authmedaddy",
          signature: "0xsignme",
          csrfToken: csrf.value,
        }),
      },
    }
  )
  expect(authorizeSpy.mock.calls[0][0]).toEqual({
    message: "authmedaddy",
    signature: "0xsignme",
    csrfToken: csrf.value,
  })

  expect(res.redirect).toBe(
    "http://localhost:3000/api/auth/error?error=EthereumSignin&provider=ethereum"
  )
})

it.only("calls signin on a valid signature", async () => {
  // NOTE: One strategy is to use the CSRF value as the nonce on the SIWE message.
  // The previous test value of "csrf" is not long enough to be a valid nonce.
  const { secret, csrf } = await createCSRF('supersecurecsrfvalue')
  const signIn = jest.fn(() => true)

  const ethereumProvider = EthereumProvider({})
  const authorizeSpy = jest.spyOn(ethereumProvider, "authorize")
  process.env.NEXTAUTH_URL = "http://next.auth.url"
  // 0x8c77aC88e481FDFAcD801dF29C406b545883467d
  const wallet = new ethers.Wallet(
    "0xacf31b9822a6c78768ff69efc92425f6588000952bcc3d0e4ee10d3fbf142598"
  )
  console.log({address: wallet.address})
  const testMessage = new SiweMessage({
    domain: "next.auth.url",
    address: wallet.address,
    statement: "Sign in test",
    uri: "http://mywebsite.com",
    version: "1",
    chainId: 1,
    nonce: csrf.value,
  })
  const testSignature = await wallet.signMessage(testMessage.prepareMessage())

  const { res } = await handler(
    {
      adapter: mockAdapter(),
      providers: [ethereumProvider],
      callbacks: { signIn },
      secret
    },
    {
      path: "callback/ethereum",
      requestInit: {
        method: "POST",
        headers: { cookie: csrf.cookie },
        body: JSON.stringify({
          message: testMessage.prepareMessage(),
          signature: testSignature,
          csrfToken: csrf.value,
        }),
      },
    }
  )
  expect(authorizeSpy).toHaveBeenCalled()
  expect(signIn).toHaveBeenCalledWith({
    message: "authmedaddy",
    signature: "0xsignme",
    csrfToken: csrf.value,
  })

  expect(res.redirect).toBe(
    "http://localhost:3000/api/auth/error?error=EthereumSignin&provider=ethereum"
  )
})
