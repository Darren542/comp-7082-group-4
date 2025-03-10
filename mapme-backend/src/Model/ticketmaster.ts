import {UUID} from 'crypto'

export interface Ticketmaster {
    location_id: UUID;
    name: string;
    lat: number;
    long: number;
    image: string;
};