import { signToken, verifyToken } from "./src/lib/auth";

async function test() {
    const payload = {
        id: 1,
        email: "admin@timey.com",
        role: "admin",
        name: "Admin User"
    };

    const token = await signToken(payload);
    console.log("Token:", token);

    const verified = await verifyToken(token);
    console.log("Verified Payload:", JSON.stringify(verified, null, 2));
}

test();
