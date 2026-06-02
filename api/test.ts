import { pool } from "./db.js";

const result = await pool.query(`SELECT * FROM doctors`);

console.log(result.rows);

