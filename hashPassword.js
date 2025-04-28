import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    const hashedPassword = await hashPassword("admin123");
    console.log(hashedPassword);
  } catch (err) {
    console.error(err);
  }
}

main();
