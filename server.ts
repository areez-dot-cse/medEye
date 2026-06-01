import express from 'express';
import {pool} from "./db.js"
import authorityRouter from "./routes/authority.routes.js";
import authRouter from "./routes/auth.routes.js"
import { authenticate } from './middlewares/auth.middleware.js';
import manufacturerRouter from "./routes/manufacturers.routes.js";
import doctorRouter from "./routes/doctors.routes.js";
import verificationRouter from "./routes/verification.routes.js";
import dispenseRouter from "./routes/dispense.routes.js";

const port = Number(process.env.PORT);

const app = express();

app.use(express.json());
app.use("/auth", authRouter);
app.use("/authority", authorityRouter);
app.use("/manufacturers", manufacturerRouter);
app.use("/doctors", doctorRouter);
app.use("/verify", verificationRouter);
app.use("/dispense", dispenseRouter);

app.get("/", (req,res)=>{
    res.send("Welcome to MedEYE API");
});

app.listen(port, ()=>{
    console.log(`Server is listening on port ${port}`)
});

app.get("/test", authenticate, (req,res)=>{
    res.json((req as any).user);
});







