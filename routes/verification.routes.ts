import express from "express";
import { pool } from "../db.js";
import { verifySignature } from "../utils/signature.js";

const router = express.Router();

router.get("/strip/:uid", async (req,res)=>{
    try{
        const result = await pool.query(
            `
            SELECT
                ms.strip_uid,
                ms.signature,
                ms.status,

                mb.batch_uid,
                mb.drug_code,

                m.manufacturer_uid,
                m.company_name

            FROM medicine_strips ms

            JOIN medicine_batches mb
                ON ms.batch_id = mb.id

            JOIN manufacturers m
                ON mb.manufacturer_id = m.id

            WHERE ms.strip_uid=$1
            `,
            [req.params.uid]
        );
        if(result.rows.length===0){
            return res.status(404).json({
                valid: false,
                message: "Counterfeit"
            });
        }
        const strip = result.rows[0];
        const validSignature = verifySignature(strip.strip_uid, strip.signature);
        if(!validSignature){
            return res.status(400).json({
                valid: false,
                message: "Invalid signature"
            });
        }

        return res.status(200).json({
            valid: true,
            strip
        });

    }catch(error){

        console.error(error);

        return res.status(500).json({
            message: "Verification failed"
        });
    }
});

router.get("/prescription/:uid", async (req,res)=>{
    try{

        const result = await pool.query(
                `SELECT
                    p.prescription_uid,
                    p.signature,
                    p.status,
                    p.drug_code,
                    p.strip_count,

                    d.doctor_uid,
                    d.name

                FROM prescriptions p

                JOIN doctors d
                    ON p.doctor_id=d.id

                WHERE p.prescription_uid=$1
                `,
                [req.params.uid]
            );
        if(result.rows.length===0){
            return res.status(404).json({
                valid: false,
                message: "Prescription not found"
            });
        }
        const prescription = result.rows[0];
        const validSignature = verifySignature(prescription.prescription_uid, prescription.signature);
        if(!validSignature){
            return res.status(400).json({
                valid: false,
                message: "Invalid signature"
            });
        }
        return res.status(200).json({
            valid: true,
            prescription
        });

    }catch(error){
        console.error(error);
        return res.status(500).json({
            message: "Verification failed"
        });
    }
});

export default router;