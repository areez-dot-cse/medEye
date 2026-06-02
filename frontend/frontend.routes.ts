import express from "express";

const router = express.Router();

router.get("/", (req,res)=>{
    res.render("index");
});

router.get("/login", (req,res)=>{
    res.render("login");
});

router.get("/authority", (req,res)=>{
    res.render("authority");
});

router.get("/doctor", (req,res)=>{
    res.render("doctor");
});

router.get("/manufacturer", (req,res)=>{
    res.render("manufacturer");
});

router.get("/verify", (req,res)=>{
    res.render("verify");
});

export default router;