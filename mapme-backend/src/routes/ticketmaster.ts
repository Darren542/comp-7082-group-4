// ticketmasterroutes.ts
import express, { Router, Request, Response } from "express";
const router = Router();

const apiKey = process.env.TICKETMASTER_API_KEY as string;
const ticketmasterBaseURL = "https://app.ticketmaster.com/discovery/v2/events.json";

// Define an interface for query parameters
interface EventQueryParams {
    latitude?: string;
    longitude?: string;
    radius?: string;
    size?: string;
}

router.get("/events", async (req: Request, res: Response) => {
    console.log("Ticketmaster API route hit with query params:", req.query);
    try {
        const { latitude, longitude, radius = 50, size = 100 } = req.query as EventQueryParams;
        
        if (!latitude || !longitude) {
            console.log("Missing required parameters");
            res.status(400).json({ error: "Missing required query parameters" });
            return;
        }

        //extra perams for API call
        const url = new URL(ticketmasterBaseURL);
        url.searchParams.append("apikey", apiKey);
        url.searchParams.append("latlong", `${latitude},${longitude}`);
        url.searchParams.append("radius", radius.toString());
        url.searchParams.append("size", size.toString());
        
        console.log(`Fetching events from: ${url.toString()}`);
        const response = await fetch(url.toString());
        //console.log(response.body);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch events from Ticketmaster: ${response.status}`);
        }

        const data = await response.json();
        //console.log(`Fetched ${data._embedded.events.length} events`);
        //console.log(data._embedded.events[0]);
        res.json(data);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

export default router;