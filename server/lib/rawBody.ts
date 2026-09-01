import type { Request } from 'express'

export interface RawBodyRequest extends Request {
  rawBody?: Buffer
}

/**
 * express.json() `verify` hook — stash the exact bytes we received so HMAC
 * signatures can be checked against them. Re-serializing the parsed body is
 * not equivalent: key order and whitespace are not preserved.
 */
export function captureRawBody(req: RawBodyRequest, _res: unknown, buf: Buffer) {
  req.rawBody = buf
}
