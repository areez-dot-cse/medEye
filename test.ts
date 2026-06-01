import {
    generateToken,
    verifyToken
} from "./utils/jwt.js";

const token = generateToken({
    uid: "MAN-123",
    role: "manufacturer"
});

console.log(token);

const decoded = verifyToken(token);

console.log(decoded);