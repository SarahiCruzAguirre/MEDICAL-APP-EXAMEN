import { SignJWT, jwtVerify } from 'jose'
const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!)
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!)
export async function signAccess(payload: { userId: string; role: string }) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('10m').sign(accessSecret)
}
export async function signRefresh(payload: { userId: string }) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(refreshSecret)
}
export async function verifyAccess(token: string) {
  const { payload } = await jwtVerify(token, accessSecret)
  return payload as { userId: string; role: string }
}
export async function verifyRefresh(token: string) {
  const { payload } = await jwtVerify(token, refreshSecret)
  return payload as { userId: string }
}
