import express from "express";
import { pool } from "../db.js";
import bcrypt from "bcrypt";
import { generateUid } from "../utils/uid.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/manufacturers", authenticate, authorizeRole("authority"),async (req,res)=>{
        try{
            const {
                companyName,
                licenseNumber,
                email,
                password
            } = req.body;
            if(!companyName || !licenseNumber || !email || !password){
                return res.status(400).json({
                    message: "Missing fields"
                });
            }
            const manufacturerUid = generateUid("MAN");
            const passwordHash = await bcrypt.hash(password, 10);

            const result = await pool.query(
                `INSERT INTO manufacturers (
                    manufacturer_uid,
                    company_name,
                    license_number,
                    email,
                    password_hash,
                    status
                )
                VALUES ($1,$2,$3,$4,$5,$6)
                RETURNING
                    manufacturer_uid,
                    company_name,
                    license_number,
                    email,
                    status`
                    ,
                [   manufacturerUid,
                    companyName,
                    licenseNumber,
                    email,
                    passwordHash,
                    "active"
                ]
            );
            return res.status(201).json(
                result.rows[0]
            );

        }catch(error){
            console.error(error);
            if((error as any).code==="23505"){
                return res.status(409).json({
                    message: "Manufacturer already exists"
                });
            }
            return res.status(500).json({
                message: "Failed to create manufacturer"
            });
        }
    }
);

router.post("/doctors", authenticate, authorizeRole("authority"), async (req,res)=>{
        try{
            const {
                name,
                licenseNumber,
                email,
                password
            } = req.body;
            if(!name || !licenseNumber || !email || !password){
                return res.status(400).json({
                    message: "Missing fields"
                });
            }
            const doctorUid = generateUid("DOC");
            const passwordHash = await bcrypt.hash(password, 10);
            const result = await pool.query(
                `INSERT INTO doctors (
                    doctor_uid,
                    name,
                    license_number,
                    email,
                    password_hash,
                    status
                )
                VALUES ($1,$2,$3,$4,$5,$6)
                RETURNING
                    doctor_uid,
                    name,
                    license_number,
                    email,
                    status`
                    ,
                [   doctorUid,
                    name,
                    licenseNumber,
                    email,
                    passwordHash,
                    "active"
                ]
            );
            return res.status(201).json(
                result.rows[0]
            );

        }catch(error){
            console.error(error);
            if((error as any).code==="23505"){
                return res.status(409).json({
                    message:"Doctor already exists"
                });
            }
            return res.status(500).json({
                message: "Failed to create doctor"
            });
        }
    }
);

router.patch("/manufacturers/:uid/revoke", authenticate, authorizeRole("authority"), async (req,res)=>{
        try{
            const result = await pool.query(
               `UPDATE manufacturers
                SET status='revoked'
                WHERE manufacturer_uid=$1
                RETURNING
                    manufacturer_uid,
                    company_name,
                    status`,
                [req.params.uid]
            );
            if(result.rows.length===0){
                return res.status(404).json({
                    message: "Manufacturer not found"
                });
            }
            return res.status(200).json(
                result.rows[0]
            );

        }catch(error){
            console.error(error);
            return res.status(500).json({
                message: "Failed to revoke manufacturer"
            });
        }
    }
);

router.patch("/doctors/:uid/revoke", authenticate, authorizeRole("authority"), async (req,res)=>{
        try{
            const result = await pool.query(
               `UPDATE doctors
                SET status='revoked'
                WHERE doctor_uid=$1
                RETURNING
                    doctor_uid,
                    name,
                    status`,
                [req.params.uid]
            );
            if(result.rows.length===0){
                return res.status(404).json({
                    message: "Doctor not found"
                });
            }
            return res.status(200).json(
                result.rows[0]
            );

        }catch(error){
            console.error(error);
            return res.status(500).json({
                message: "Failed to revoke doctor"
            });
        }
    }
);

router.get("/doctors", authenticate, authorizeRole("authority"), async (req,res)=>{
        try{
            const result = await pool.query(
                    `SELECT
                        doctor_uid,
                        name,
                        license_number,
                        email,
                        status
                    FROM doctors
                    ORDER BY name`
                );
            return res.status(200).json(result.rows);

        }catch(error){
            console.error(error);
            return res.status(500).json({
                message: "Failed to fetch doctors"
            });
        }
    }
);

router.get("/manufacturers", authenticate, authorizeRole("authority"), async (req,res)=>{
        try{
                const result = await pool.query(
                    `SELECT
                        manufacturer_uid,
                        company_name,
                        license_number,
                        email,
                        status
                    FROM manufacturers
                    ORDER BY company_name`
                );
            return res.status(200).json(result.rows);

        }catch(error){
            console.error(error);
            return res.status(500).json({
                message: "Failed to fetch manufacturers"
            });
        }
    }
);

export default router;