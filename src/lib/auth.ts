import { SignJWT, jwtVerify } from "jose";

// Ensure a strong fallback that matches the local development .env so that
// Edge Middleware and Node Server Actions do not end up with mismatched secrets
const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "timey-secure-jwt-secret-key-123456"
);

export type JWTPayload = {
    id: number;
    email: string;
    role: string;
    name: string;
};

export async function signToken(payload: JWTPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as JWTPayload;
    } catch (error) {
        return null;
    }
}
