import express from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRole } from "../middlewares/role.middleware.js";
import { generateUid } from "../utils/uid.js";
import { generateSignature } from "../utils/signature.js";
import { generateQr } from "../utils/qr.js";

const router = express.Router();

router.post("/batches", authenticate, authorizeRole("manufacturer"), async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { drugCode, stripCount, expiryDate } = req.body;

      if (!drugCode || !stripCount || !expiryDate) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Missing fields",
        });
      }

      const manufacturerUid = (req as any).user.uid;

      const manufacturerResult = await client.query(
        `SELECT *
                    FROM manufacturers
                    WHERE manufacturer_uid=$1
                    `,
        [manufacturerUid],
      );

      if (manufacturerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Manufacturer not found",
        });
      }

      const manufacturer = manufacturerResult.rows[0];

      if (manufacturer.status !== "active") {
        await client.query("ROLLBACK");
        return res.status(403).json({
          message: "Manufacturer revoked",
        });
      }

      const batchUid = generateUid("BAT");

      const batchResult = await client.query(
        `INSERT INTO medicine_batches (
                        batch_uid,
                        drug_code,
                        manufacturer_id,
                        strip_count,
                        manufactured_at,
                        expiry_date
                    )
                    VALUES ($1,$2,$3,$4,$5,$6)
                    RETURNING *
                    `,
        [
          batchUid,
          drugCode,
          manufacturer.id,
          stripCount,
          new Date(),
          expiryDate,
        ],
      );

      const generatedStrips = [];
      for (let i = 0; i < stripCount; i++) {
        const stripUid = generateUid("STR");
        const signature = generateSignature(stripUid);
        const stripResult = await client.query(
          `INSERT INTO medicine_strips (
                            strip_uid,
                            signature,
                            batch_id,
                            status,
                            created_at
                        )
                        VALUES ($1,$2,$3,$4,$5)
                        RETURNING *`,
          [
            stripUid,
            signature,
            batchResult.rows[0].id,
            "available",
            new Date(),
          ],
        );
        const qr =await generateQr(stripUid, signature );
        generatedStrips.push({...stripResult.rows[0], qr});
      }
      await client.query("COMMIT");
      return res.status(201).json({
        batch: batchResult.rows[0],
        strips: generatedStrips,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(error);
      return res.status(500).json({
        message: "Failed to create batch",
      });
    } finally {
      client.release();
    }
  },
);

router.get("/batches", authenticate, authorizeRole("manufacturer"), async (req,res)=>{
        try{
            const manufacturerUid = (req as any).user.uid;
            const manufacturerResult = await pool.query(
                    `SELECT id
                    FROM manufacturers
                    WHERE manufacturer_uid=$1
                    `,[manufacturerUid]
                );

            if(manufacturerResult.rows.length===0){
                return res.status(404).json({
                    message:"Manufacturer not found"
                });
            }

            const manufacturerId = manufacturerResult.rows[0].id;
            const batches = await pool.query(
                   `SELECT *
                    FROM medicine_batches
                    WHERE manufacturer_id=$1
                    ORDER BY manufactured_at DESC
                    `, [manufacturerId]
                );
            return res.status(200).json(batches.rows);
        }catch(error){
            console.error(error);
            return res.status(500).json({
                message:"Failed to fetch batches"
            });
        }
    }
);

router.get("/me", authenticate, authorizeRole("manufacturer"), async (req, res) => {
    try {
      const manufacturerUid = (req as any).user.uid;
      const result = await pool.query(
        `SELECT
          manufacturer_uid,
          company_name,
          license_number,
          email,
          status
          FROM manufacturers
          WHERE manufacturer_uid=$1
        `, [manufacturerUid],
      );
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Manufacturer not found",
        });
      }
      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to fetch manufacturer",
      });
    }
  },
);

router.get("/batches/:batchUid", authenticate, authorizeRole("manufacturer"), async (req, res) => {
    try {
      const manufacturerUid = (req as any).user.uid;

      const manufacturerResult = await pool.query(
        `SELECT id
          FROM manufacturers
          WHERE manufacturer_uid=$1`,
        [manufacturerUid],
      );

      if (manufacturerResult.rows.length === 0) {
        return res.status(404).json({
          message: "Manufacturer not found",
        });
      }

      const manufacturerId = manufacturerResult.rows[0].id;

      const batchResult = await pool.query(
        `SELECT *
         FROM medicine_batches
         WHERE
         batch_uid=$1
         AND
         manufacturer_id=$2`,
        [req.params.batchUid, manufacturerId],
      );

      if (batchResult.rows.length === 0) {
        return res.status(404).json({
          message: "Batch not found",
        });
      }

      const batch = batchResult.rows[0];

      const stripsResult = await pool.query(
        `SELECT
         strip_uid,
         signature,
         status,
         created_at
         FROM medicine_strips
         WHERE batch_id=$1
         ORDER BY created_at`,
        [batch.id],
      );

      const strips = await Promise.all(
        stripsResult.rows.map(async (strip) => {
          const qr = await generateQr(strip.strip_uid, strip.signature);

          return {
            strip_uid: strip.strip_uid,

            status: strip.status,

            created_at: strip.created_at,

            qr,
          };
        }),
      );

      return res.status(200).json({
        batch,
        strips,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to fetch batch",
      });
    }
  },
);


export default router;
