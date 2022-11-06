import { PrismaClient } from "@prisma/client"

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

console.log("EEEEEEEE", process.env.DATABASE_URL)

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["query"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== "production") global.prisma = prisma
