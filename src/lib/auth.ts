import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "timey-default-secret-do-not-use-in-prod"
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
