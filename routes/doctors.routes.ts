import express from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRole } from "../middlewares/role.middleware.js";
import { generateUid } from "../utils/uid.js";
import { generateSignature } from "../utils/signature.js";
import { generateQr } from "../utils/qr.js";

const router = express.Router();

router.post("/prescriptions", authenticate, authorizeRole("doctor"), async (req,res)=>{
        try{
            const {
                drugCode,
                stripCount
            } = req.body;

            if(!drugCode || !stripCount){
                return res.status(400).json({
                    message: "Missing fields"
                });
            }
            const doctorUid = (req as any).user.uid;
            const doctorResult = await pool.query(
                    `SELECT *
                    FROM doctors
                    WHERE doctor_uid=$1`,
                    [doctorUid]
                );

            if(doctorResult.rows.length===0){
                return res.status(404).json({
                    message: "Doctor not found"
                });
            }
            const doctor = doctorResult.rows[0];
            const prescriptionUid = generateUid("RX");

            const signature = generateSignature(prescriptionUid);
            const qr = await generateQr(prescriptionUid, signature);
            const result = await pool.query(
                    `
                    INSERT INTO prescriptions (
                        prescription_uid,
                        signature,
                        doctor_id,
                        drug_code,
                        strip_count,
                        issued_at,
                        status
                    )
                    VALUES ($1,$2,$3,$4,$5,$6,$7)
                    RETURNING *
                    `,
                    [   prescriptionUid,
                        signature,
                        doctor.id,
                        drugCode,
                        stripCount,
                        new Date(),
                        "active"
                    ]
                );

            return res.status(201).json({...result.rows[0], qr});
        }catch(error){
            console.error(error);
            return res.status(500).json({
                message: "Failed to create prescription"
            });
        }
    }
);

router.get("/prescriptions", authenticate, authorizeRole("doctor"), async (req,res)=>{
        try{
            const doctorUid = (req as any).user.uid;
            const doctorResult = await pool.query(
                    `SELECT id
                    FROM doctors
                    WHERE doctor_uid=$1
                    `,[doctorUid]);
            if(doctorResult.rows.length===0){
                return res.status(404).json({
                    message: "Doctor not found"
                });
            }
            const doctorId = doctorResult.rows[0].id;
            const prescriptions = await pool.query(
                    `SELECT *
                    FROM prescriptions
                    WHERE doctor_id=$1
                    ORDER BY issued_at DESC
                    `, [doctorId]
                );

            return res.status(200).json(prescriptions.rows);

        }catch(error){
            console.error(error);
            return res.status(500).json({
                message: "Failed to fetch prescriptions"
            });
        }
    }
);

router.get("/me", authenticate, authorizeRole("doctor"), async (req,res)=>{
        try{
            const doctorUid = (req as any).user.uid;
            const result = await pool.query(
                       `SELECT
                        doctor_uid,
                        name,
                        license_number,
                        email,
                        status
                    FROM doctors
                    WHERE doctor_uid=$1
                    `,[doctorUid]
                );

            if(result.rows.length===0){
                return res.status(404).json({
                    message: "Doctor not found"
                });
            }
            return res.status(200).json(result.rows[0]);
        }catch(error){
            console.error(error);
            return res.status(500).json({
                message:"Failed to fetch doctor"
            });
        }
    }
);

router.get("/prescriptions/:prescriptionUid", authenticate, authorizeRole("doctor"), async (req,res)=>{
        try{
            const doctorUid = (req as any).user.uid;
            const doctorResult = await pool.query(
                    `SELECT id
                    FROM doctors
                    WHERE doctor_uid=$1
                    `, [doctorUid]
                );
            if(doctorResult.rows.length===0){
                return res.status(404).json({
                    message: "Doctor not found"
                });
            }
            const doctorId = doctorResult.rows[0].id;
            const prescriptionResult = await pool.query(
                    `SELECT *
                    FROM prescriptions
                    WHERE
                        prescription_uid=$1
                        AND
                        doctor_id=$2
                    `,[ req.params.prescriptionUid,
                        doctorId]
                );
            if(prescriptionResult.rows.length===0){
                return res.status(404).json({
                    message: "Prescription not found"
                });
            }
            const prescription = prescriptionResult.rows[0];
            const dispenseResult = await pool.query(
                    `SELECT
                        d.dispensed_at,
                        ms.strip_uid
                    FROM dispenses d
                    JOIN medicine_strips ms
                        ON d.strip_id = ms.id
                    WHERE d.prescription_id=$1
                    `,[prescription.id]
                );
            return res.status(200).json({
                prescription,
                dispense: dispenseResult.rows[0] || null
            });

        }catch(error){
            console.error(error);
            return res.status(500).json({
                message: "Failed to fetch prescription"
            });
        }
    }
);

export default router;