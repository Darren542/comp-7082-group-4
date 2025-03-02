import express, { Router, Request, Response } from "express";
const router = Router();

const apiKey = process.env.TICKETMASTER_API_KEY as string;
const ticketmasterURL: string = `https://app.ticketmaster.com/discovery/v2/events.json?countryCode=CA&apikey=${apiKey}`;

// Define an interface for query parameters
interface EventQueryParams {
    latitude?: string;
    longitude?: string;
    radius?: string;
}

router.get("/events", async (req: Request, res: Response) => {
    try {
        const { latitude, longitude, radius = 50 } = req.query as EventQueryParams;
        
        if (!latitude || !longitude) {
            res.status(400).json({ error: "Missing required query parameters" });
            return;
        }

        const response = await fetch(`${ticketmasterURL}&latlong=${latitude},${longitude}&radius=${radius}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch events from Ticketmaster');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

export default router;