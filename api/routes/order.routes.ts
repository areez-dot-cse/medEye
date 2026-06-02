import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { prescriptionUid } = req.body;

    if (!prescriptionUid) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Prescription UID required",
      });
    }

    const prescriptionResult = await client.query(
      `
                SELECT *
                FROM prescriptions
                WHERE prescription_uid=$1
                `,
      [prescriptionUid],
    );

    if (prescriptionResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    const prescription = prescriptionResult.rows[0];

    if (prescription.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Prescription already used",
      });
    }

    const stripResult = await client.query(
      `
                SELECT
                    ms.*,
                    mb.batch_uid
                FROM medicine_strips ms
                JOIN medicine_batches mb
                    ON ms.batch_id = mb.id
                WHERE
                    mb.drug_code=$1
                    AND
                    ms.status='available'
                LIMIT 1
                `,
      [prescription.drug_code],
    );

    if (stripResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "No medicine available",
      });
    }

    const strip = stripResult.rows[0];

    await client.query(
      `
            INSERT INTO dispenses(
                prescription_id,
                strip_id,
                dispensed_at
            )
            VALUES($1,$2,$3)
            `,
      [prescription.id, strip.id, new Date()],
    );

    await client.query(
      `
            UPDATE prescriptions
            SET status='used'
            WHERE id=$1
            `,
      [prescription.id],
    );

    await client.query(
      `
            UPDATE medicine_strips
            SET status='dispensed'
            WHERE id=$1
            `,
      [strip.id],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Medicine dispensed successfully",

      prescriptionUid: prescription.prescription_uid,

      stripUid: strip.strip_uid,

      drugCode: prescription.drug_code,

      batchUid: strip.batch_uid,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    return res.status(500).json({
      message: "Order failed",
    });
  } finally {
    client.release();
  }
});

export default router;
