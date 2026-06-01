import crypto from "crypto";

export function generateUid(prefix: string): string {
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `${prefix}-${randomPart}`;
}