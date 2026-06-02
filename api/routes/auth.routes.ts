import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import { pool } from "../db.js";
import { generateToken } from "../utils/jwt.js";

dotenv.config();
const AUTHORITY_USERNAME: string = process.env.AUTHORITY_USERNAME!;
const AUTHORITY_PASSWORD: string = process.env.AUTHORITY_PASSWORD!;
const router = express.Router();

router.post("/authority/login", async (req,res)=>{
    try{
        const { username, password } = req.body;
        if(!username || !password){
            return res.status(400).json({
                message: "Missing credentials"
            });
        }
        if(
            username !== AUTHORITY_USERNAME ||
            password !== AUTHORITY_PASSWORD
        ){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
        const token = generateToken({role: "authority"});
        return res.status(200).json({token});

    }catch(error){
        console.error(error);
        return res.status(500).json({
            message: "Login failed"
        });
    }
});

router.post("/manufacturer/login", async (req,res)=>{
    try{
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({
                message: "Missing credentials"
            });
        }
        const result = await pool.query(`SELECT *FROM manufacturers WHERE email=$1`,[email]);
        if(result.rows.length===0){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
        const manufacturer = result.rows[0];
        if(manufacturer.status !== "active"){
            return res.status(403).json({
                message: "Manufacturer revoked"
            });
        }
        const passwordMatch =
            await bcrypt.compare(
                password,
                manufacturer.password_hash
            );

        if(!passwordMatch){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
        const token = generateToken({
            id: manufacturer.id,
            uid: manufacturer.manufacturer_uid,
            role: "manufacturer"
        });
        return res.status(200).json({token});

    }catch(error){
        console.error(error);
        return res.status(500).json({
            message: "Login failed"
        });
    }
});

router.post("/doctor/login", async (req,res)=>{
    try{
        const { email, password } = req.body;
        if(!email || !password){
            return res.status(400).json({
                message: "Missing credentials"
            });
        }
        const result = await pool.query(
            `SELECT * FROM doctors WHERE email=$1`,[email]);

        if(result.rows.length===0){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
        const doctor = result.rows[0];
        if(doctor.status !== "active"){
            return res.status(403).json({
                message: "Doctor revoked"
            });
        }
        const passwordMatch = await bcrypt.compare(
                password,
                doctor.password_hash
            );
        if(!passwordMatch){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
        const token = generateToken({
            id: doctor.id,
            uid: doctor.doctor_uid,
            role: "doctor"
        });

        return res.status(200).json({
            token
        });

    }catch(error){
        console.error(error);
        return res.status(500).json({
            message: "Login failed"
        });
    }
});

export default router;