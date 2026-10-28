import type { IncomingMessage } from 'node:http'

export type ServerlessRequest = Pick<IncomingMessage, 'method' | 'headers'> & {
  query: Record<string, string | string[] | undefined>
  body: unknown
}

export interface ServerlessResponse {
  setHeader(name: string, value: string | number | readonly string[]): void
  status(code: number): ServerlessResponse
  json(body: unknown): ServerlessResponse
}
