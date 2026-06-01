import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.post("/", async (req,res)=>{
        const client = await pool.connect();
        try{
            await client.query("BEGIN");
            const {
                prescriptionUid,
                stripUid
            } = req.body;
            if(!prescriptionUid || !stripUid){
                return res.status(400).json({
                    message: "Missing fields"
                });
            }
            const prescriptionResult = await client.query(
                    `SELECT *
                    FROM prescriptions
                    WHERE prescription_uid=$1
                    `,
                    [prescriptionUid]
                );
            if(prescriptionResult.rows.length===0){
                await client.query("ROLLBACK");
                return res.status(404).json({
                    message: "Prescription not found"
                });
            }
            const prescription = prescriptionResult.rows[0];
            if(prescription.status!=="active"){
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message: "Prescription already used"
                });
            }
            const stripResult = await client.query(
                    `SELECT *
                    FROM medicine_strips
                    WHERE strip_uid=$1
                    `,
                    [stripUid]
                );
            if(stripResult.rows.length===0){
                await client.query("ROLLBACK");
                return res.status(404).json({
                    message: "Strip not found"
                });
            }
            const strip = stripResult.rows[0];
            if(strip.status!=="available"){
                await client.query("ROLLBACK");
                return res.status(400).json({
                    message:"Strip already dispensed"
                });
            }
            await client.query(
                `INSERT INTO dispenses(
                    prescription_id,
                    strip_id,
                    dispensed_at
                )
                VALUES ($1,$2,$3)
                `,
                [   prescription.id,
                    strip.id,
                    new Date()
                ]
            );
            await client.query(
              `UPDATE prescriptions
                SET status='used'
                WHERE id=$1
                `,
                [prescription.id]
            );

            await client.query(
                `UPDATE medicine_strips
                SET status='dispensed'
                WHERE id=$1
                `,
                [strip.id]
            );

            await client.query("COMMIT");

            return res.status(200).json({
                message:"Medicine dispensed successfully"
            });

        }catch(error){
            await client.query("ROLLBACK");
            console.error(error);
            return res.status(500).json({
                message:"Dispense failed"
            });

        }finally{
            client.release();
        }
    }
);

export default router;