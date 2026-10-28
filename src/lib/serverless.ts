import type { IncomingMessage, ServerResponse } from 'node:http'

export type ServerlessRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>
  body: unknown
}

export type ServerlessResponse = ServerResponse & {
  status(code: number): ServerlessResponse
  json(body: unknown): ServerlessResponse
}
