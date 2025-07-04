import { prisma } from '@netko/brain-repository'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { openAPI } from 'better-auth/plugins'
import { brainEnvConfig } from './env'

export const auth = betterAuth({
  baseURL: brainEnvConfig.app.baseUrl,
  basePath: '/auth/api',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [openAPI()],
  ...brainEnvConfig.auth,
})

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
// biome-ignore lint/suspicious/noAssignInExpressions: workaround for openapi types in better-auth
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  getPaths: (prefix = '/auth/api') =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)

      for (const path of Object.keys(paths)) {
        const key = prefix + path
        if (paths[path]) {
          reference[key] = paths[path]

          for (const method of Object.keys(paths[path] as object)) {
            // biome-ignore lint/suspicious/noExplicitAny: workaround for openapi types in better-auth
            const operation = (reference[key] as any)[method]
            operation.tags = ['Better Auth']
          }
        }
      }

      return reference
      // biome-ignore lint/suspicious/noExplicitAny: workaround for openapi types in better-auth
    }) as Promise<any>,
  // biome-ignore lint/suspicious/noExplicitAny: workaround for openapi types in better-auth
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const
