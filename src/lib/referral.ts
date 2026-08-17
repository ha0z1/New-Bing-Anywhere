// Mirrors AA-Server/src/membership.ts: eight uppercase characters, excluding I/O/0/1.
export const INVITE_CODE_PATTERN_SOURCE = '[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}'

const INVITE_CODE_PATTERN = new RegExp(`^${INVITE_CODE_PATTERN_SOURCE}$`)

export const normalizeInviteCode = (value: string | null | undefined): string => {
  const code = value?.trim().toUpperCase() ?? ''
  return INVITE_CODE_PATTERN.test(code) ? code : ''
}
