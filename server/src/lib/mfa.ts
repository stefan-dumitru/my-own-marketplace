import { authenticator } from "otplib";
import QRCode from "qrcode";

const ISSUER = "stefanmarket";

export function generateMfaSecret(): string {
  return authenticator.generateSecret();
}

export async function generateMfaQrCode(email: string, secret: string): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, ISSUER, secret);
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyMfaCode(secret: string, code: string): boolean {
  return authenticator.check(code, secret);
}
