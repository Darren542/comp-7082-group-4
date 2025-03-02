import { Ticketmaster } from '../Model/ticketmaster';

export async function getEvents(): Promise<Ticketmaster[]> {
    const apiKey = process.env.TICKETMASTER_API_KEY as string;
    
    const params = new URLSearchParams({
        apikey: apiKey,
        city: 'Vancouver',
        countryCode: 'CA',
        classificationName: 'music',
        size: '200' // Max allowed per request
      });

    return []; 
}