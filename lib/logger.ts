import { prisma } from './prisma'
export async function logAction({ action, path, userId, ip }: { action: string; path: string; userId?: string; ip?: string }) {
  console.log(`[LOG] ${new Date().toISOString()} | ${action} | ${path} | user:${userId ?? 'anon'} | ip:${ip ?? 'unknown'}`)
  try { await prisma.log.create({ data: { action, path, userId, ip } }) } catch (e) { console.error('[LOGGER]', e) }
}
