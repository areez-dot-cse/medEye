//Authorizes
import type {Request, Response, NextFunction} from "express";

export function authorizeRole(role: string){
    return (req: Request, res: Response, next: NextFunction) => {  //middleware starts from here
        const user = (req as any).user;  //TS doesnt know if req.user exists as it does typechecking before running, so even tho auth.midlwr WILL create it, it needs to be settled down here.  
        if(!user ||user.role !== role){
            return res.status(403).json({
                message: "Access denied"
            });
        }
        next();
    };
}

/*
Request
  ↓
authenticate
  ↓
verifies JWT
  ↓
adds req.user
  ↓
authorizeRole("manufacturer")
  ↓
checks req.user.role
  ↓
createBatch()
*/