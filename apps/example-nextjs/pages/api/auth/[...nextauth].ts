import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import TwitterProvider from "next-auth/providers/twitter"
import Auth0Provider from "next-auth/providers/auth0"
import { SiweMessage } from "siwe"
import { getCsrfToken } from "next-auth/react"
import { NextApiRequest, NextApiResponse } from "next"
// import neo4j from "neo4j-driver"
// import { Neo4jAdapter } from "@next-auth/neo4j-adapter";
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "../../../lib/prismadb"
// import AppleProvider from "next-auth/providers/apple"
// import EmailProvider from "next-auth/providers/email"

// // For more information on each option (and a full list of options) go to
// // https://next-auth.js.org/configuration/options
// export const authOptions: NextAuthOptions = {
//   // https://next-auth.js.org/configuration/providers/oauth
//   providers: [
//     CredentialsProvider({
//       name: "Ethereum",
//       credentials: {
//         message: {
//           label: "Message",
//           type: "text",
//           placeholder: "0x0",
//         },
//         signature: {
//           label: "Signature",
//           type: "text",
//           placeholder: "0x0",
//         },
//       },
//       authorize: async (credentials) => {
//         try {
//           const siwe = new SiweMessage(JSON.parse(credentials?.message ?? "{}"))

//           const nextAuthUrl =
//             process.env.NEXTAUTH_URL ||
//             (process.env.VERCEL_URL
//               ? `https://${process.env.VERCEL_URL}`
//               : null)
//           if (!nextAuthUrl) {
//             return null
//           }

//           const nextAuthHost = new URL(nextAuthUrl).host
//           if (siwe.domain !== nextAuthHost) {
//             return null
//           }

//           if (siwe.nonce !== (await getCsrfToken({ req }))) {
//             return null
//           }

//           await siwe.validate(credentials?.signature || "")
//           return {
//             id: siwe.address,
//           }
//         } catch (e) {
//           return null
//         }
//       },
//     }),
//     /* EmailProvider({
//          server: process.env.EMAIL_SERVER,
//          from: process.env.EMAIL_FROM,
//        }),
//     // Temporarily removing the Apple provider from the demo site as the
//     // callback URL for it needs updating due to Vercel changing domains

//     Providers.Apple({
//       clientId: process.env.APPLE_ID,
//       clientSecret: {
//         appleId: process.env.APPLE_ID,
//         teamId: process.env.APPLE_TEAM_ID,
//         privateKey: process.env.APPLE_PRIVATE_KEY,
//         keyId: process.env.APPLE_KEY_ID,
//       },
//     }),
//     */
//   theme: {
//     colorScheme: "light",
//   },
// }

// export default NextAuth(authOptions)

// const driver = neo4j.driver(
//   "bolt://localhost",
//   neo4j.auth.basic("neo4j", "card-mountain-glass-touch")
// );
// const neo4jSession = driver.session();

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  const providers = [
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_ID,
      clientSecret: process.env.TWITTER_SECRET,
    }),
    Auth0Provider({
      clientId: process.env.AUTH0_ID,
      clientSecret: process.env.AUTH0_SECRET,
      issuer: process.env.AUTH0_ISSUER,
    }),
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        try {
          const siwe = new SiweMessage(JSON.parse(credentials?.message ?? "{}"))

          const nextAuthUrl =
            process.env.NEXTAUTH_URL ||
            (process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : null)
          if (!nextAuthUrl) {
            return null
          }

          const nextAuthHost = new URL(nextAuthUrl).host
          if (siwe.domain !== nextAuthHost) {
            return null
          }

          if (siwe.nonce !== (await getCsrfToken({ req }))) {
            return null
          }

          await siwe.validate(credentials?.signature ?? "")
          return {
            id: siwe.address,
          }
        } catch (e) {
          return null
        }
      },
    }),
  ]

  const isDefaultSigninPage =
    req.method === "GET" && req.query?.nextauth?.includes("signin")

  // Hide Sign-In with Ethereum from default sign page
  if (isDefaultSigninPage) {
    providers.pop()
  }

  return NextAuth(req, res, {
    adapter: PrismaAdapter(prisma),
    // adapter: Neo4jAdapter(neo4jSession),
    // https://next-auth.js.org/configuration/providers/oauth
    providers,
    session: {
      strategy: "database",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      async jwt({ token }) {
        console.log("Session callback ---------")
        console.log({ token })
        token.userRole = "admin"
        return token
      },
      async session({ session, token }) {
        console.log("Session callback ----------")
        console.log({ session, token })
        session.address = token?.sub
        session.user = { ...session.user }
        session.user.name = token?.sub
        return session
      },
    },
  })
}
