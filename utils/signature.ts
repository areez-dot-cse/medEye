import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const SECRET: string = process.env.MED_EYE_SECRET!;

export function generateSignature(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

export function verifySignature(data: string, signature: string) {
  return generateSignature(data) === signature;
}

