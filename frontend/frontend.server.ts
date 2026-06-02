import express from "express";
import path from "path";
import frontendRouter from "./frontend.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.set("view engine", "ejs");

app.set("views", path.join(process.cwd(), "frontend", "views", "pages"));

app.use(express.static(path.join(process.cwd(), "frontend","public")));

app.use("/", frontendRouter);

const PORT = 3001;

app.listen(PORT, "0.0.0.0",()=>{
    console.log(`Server is listening on port ${PORT}`)
});