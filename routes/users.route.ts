import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM users");
        res.status(200).json(result.rows);
    }catch(error){
        console.error(error);
        res.status(500).json({
            message: "Cant get users",
        });
    }
});

router.get("/:id", async (req,res)=>{
    try{
        const result = await pool.query("SELECT * FROM users WHERE id=$1",[req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: `User ${req.params.id} not found`
            });
        } 
        res.status(200).json(result.rows[0]);
        
    }catch(error){
         console.error(error);
        res.status(500).json({
            message: `Cant get user ${req.params.id}`,
        });
    }
});

router.put("/:id", async (req,res)=>{
    try{
        const { name, email } = req.body;
        if (!name || !email) {
        return res.status(400).json({
            message: "Name and email are required"
        });
        }
        const result = await pool.query(`UPDATE users SET name = $1, email =$2 WHERE id =$3 RETURNING *`, [name, email, req.params.id]);
        if(result.rows.length===0){ 
            res.status(404).json({
                message: `User ${req.params.id} does not exists.`
            });
        }else{
        res.status(200).json(result.rows[0]);
        }
    }catch(error){
        console.error(error);
        res.status(500).json({
            message: `Failed to update user ${req.params.id}`,
        });
    }
});

router.post("/", async (req,res)=>{
    try{
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({
            message: "Name and email are required"
            });
        }
        const result = await pool.query(
            "INSERT INTO users (name, email) VALUES ($1,$2) returning *", [req.body.name, req.body.email]
        );
        res.status(201).json(result.rows[0]);
    }catch(error){
        if ((error as any).code === "23505"){
            return res.status(409).json({
                message: "Email already exists"
                });
        }
        console.log(error);
        res.status(500).json({
            message: "failed to create user"
        });
    }
    });

router.delete("/:id", async (req,res)=>{
    try{
        const result = await pool.query("Delete FROM users WHERE id=$1 returning *",[req.params.id]);
        if(result.rows.length===0){
            return res.status(404).json({
            message: `User ${req.params.id} doesnot exists. `
            });
        }
        res.status(200).json({
            message: `User ${req.params.id} deleted. `
            });
    }catch(error){
         console.error(error);
        res.status(500).json({
            message: `Cant find user ${req.params.id}`,
        });
    }
});

export default router;