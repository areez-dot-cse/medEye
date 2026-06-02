//Authenticate
import type {Request, Response, NextFunction} from "express";

import {verifyToken} from "../utils/jwt.js";

export async function authenticate(req: Request, res: Response, next: NextFunction){
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const token = authHeader.split(" ")[1]!;

        const decoded = verifyToken(token);
        (req as any).user = decoded;   //is it saying htat: Request object type req cant contain user property, and we cant define one as well using req.user=something as TS enforces that req is a REQUEST type object and it cant have .user property, so we says that "assume req as any type", let me do whatever i want, and then we attaches the .user prop
        next();

    }catch(error){
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}