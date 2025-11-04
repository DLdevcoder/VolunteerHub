import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import allRoutes from "./src/routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/v1", allRoutes);
app.get("/", (req, res) => {
  res.send("Chào mừng đến với VolunteerHub API!");
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
