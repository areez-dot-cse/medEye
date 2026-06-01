import {pool} from "./db.js"

async function initializeDatabase(){
    try{
        await pool.query(
            `CREATE TABLE IF NOT EXISTS doctors (
                id SERIAL PRIMARY KEY,
                doctor_uid VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                license_number VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'revoked'))
                );`
            );console.log("doctors table created.");
            
            await pool.query(`CREATE TABLE IF NOT EXISTS manufacturers (
                id SERIAL PRIMARY KEY,
                manufacturer_uid VARCHAR(100) UNIQUE NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                license_number VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'revoked'))
                );`
            );console.log("Manufacturers table created.");

            await pool.query(`CREATE TABLE IF NOT EXISTS medicine_batches (
                id SERIAL PRIMARY KEY,
                batch_uid VARCHAR(100) UNIQUE NOT NULL,
                drug_code VARCHAR(100) NOT NULL,
                manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id),
                strip_count INTEGER NOT NULL,
                manufactured_at TIMESTAMP NOT NULL,
                expiry_date DATE NOT NULL
                );`
            );console.log("medicine_batches table created.");

            await pool.query(`CREATE TABLE IF NOT EXISTS medicine_strips (
                id SERIAL PRIMARY KEY,
                strip_uid VARCHAR(100) UNIQUE NOT NULL,
                signature TEXT NOT NULL,
                batch_id INTEGER NOT NULL REFERENCES medicine_batches(id),
                status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'dispensed')),
                created_at TIMESTAMP NOT NULL
            );`
            );console.log("medicine_strips table created.");

            await pool.query(`CREATE TABLE IF NOT EXISTS prescriptions (
                id SERIAL PRIMARY KEY,
                prescription_uid VARCHAR(100) UNIQUE NOT NULL,
                signature TEXT NOT NULL,
                doctor_id INTEGER NOT NULL REFERENCES doctors(id),
                drug_code VARCHAR(100) NOT NULL,
                strip_count INTEGER NOT NULL,
                issued_at TIMESTAMP NOT NULL,
                status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'used', 'revoked'))
            );`
            );console.log("prescription table created.");

            await pool.query(`CREATE TABLE IF NOT EXISTS dispenses (
                id SERIAL PRIMARY KEY,
                prescription_id INTEGER UNIQUE NOT NULL REFERENCES prescriptions(id),
                strip_id INTEGER NOT NULL REFERENCES medicine_strips(id),
                dispensed_at TIMESTAMP NOT NULL
            );`
            );console.log("dispense table created.");


    }catch(error){
        console.error("Database initialization failed:", error);
    }finally{
        await pool.end();
    }
}

initializeDatabase();