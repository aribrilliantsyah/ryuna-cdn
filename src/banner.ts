const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const CYAN = '\x1b[36m'
const MAGENTA = '\x1b[35m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'

export interface BannerInfo {
  version: string
  env: string
  node: string
  port: number
  host: string
  protocol: string
}

export function printBanner(info: BannerInfo): void {
  if (process.env.RYUNACDN_NO_BANNER === 'true') return

  const url = `${info.protocol}://${info.host}:${info.port}`
  const lines = [
    '',
    `    ${CYAN}╱|、${RESET}`,
    `   ${CYAN}(˚ˎ 。7${RESET}      ${BOLD}${MAGENTA}RyunaCDN${RESET} ${DIM}v${info.version}${RESET}`,
    `    ${CYAN}|、˜〵${RESET}      ${DIM}by aribrilliantsyah${RESET}`,
    `    ${CYAN}じしˍ,)ノ${RESET}`,
    '',
    `   ${YELLOW}▸${RESET} env     ${DIM}:${RESET} ${GREEN}${info.env}${RESET}`,
    `   ${YELLOW}▸${RESET} node    ${DIM}:${RESET} ${info.node}`,
    `   ${YELLOW}▸${RESET} listen  ${DIM}:${RESET} ${BOLD}${url}${RESET}`,
    ''
  ]
  process.stdout.write(lines.join('\n') + '\n')
}
