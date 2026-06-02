import type { FastifyReply, FastifyRequest } from 'fastify'

interface ParsedRange {
  start: number
  end: number
}

function parseRange(size: number, rangeHeader: string): ParsedRange | -1 | -2 {
  if (!rangeHeader.startsWith('bytes=')) return -2
  const ranges = rangeHeader.slice(6).split(',')
  if (ranges.length !== 1) return -2
  const [startStr, endStr] = ranges[0]!.split('-')
  let start = startStr ? Number.parseInt(startStr, 10) : Number.NaN
  let end = endStr ? Number.parseInt(endStr, 10) : Number.NaN
  if (Number.isNaN(start) && Number.isNaN(end)) return -2
  if (Number.isNaN(start)) {
    start = size - end
    end = size - 1
  } else if (Number.isNaN(end)) {
    end = size - 1
  }
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start < 0) return -1
  if (end >= size) end = size - 1
  return { start, end }
}

export function sendSeekable(req: FastifyRequest, reply: FastifyReply, data: Buffer, type: string): void {
  reply.header('Accept-Ranges', 'bytes').header('Content-Type', type)
  const rangeHeader = req.headers.range
  if (!rangeHeader) {
    reply.header('Content-Length', data.byteLength).send(data)
    return
  }
  const parsed = parseRange(data.byteLength, rangeHeader)
  if (parsed === -2) {
    reply.code(400).send()
    return
  }
  if (parsed === -1) {
    reply.header('Content-Range', `*/${data.byteLength}`).code(416).send()
    return
  }
  const { start, end } = parsed
  reply
    .code(206)
    .header('Content-Length', end - start + 1)
    .header('Content-Range', `bytes ${start}-${end}/${data.byteLength}`)
    .send(data.subarray(start, end + 1))
}
