import { Router, Request, Response } from "express";

const router = Router();

let travelAdvisoryData: any = null;
const dataUrl = "https://data.international.gc.ca/travel-voyage/index-alpha-eng.json";

router.get("/", async (req: Request, res: Response) => {
    if (travelAdvisoryData) {
        res.json(travelAdvisoryData);
        return;
    } else {
        const response = await fetch(dataUrl);
        if (!response.ok) {
            res.status(500).json({ error: "Failed to fetch travel advisory data." });
            return;
        }
        travelAdvisoryData = await response.json();
        res.json(travelAdvisoryData);
    }
});

export default router;