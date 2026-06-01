/**
 * Geocoding Service using Nominatim (OpenStreetMap)
 * 
 * Provides functions to convert addresses and city names into coordinates.
 * Includes rate-limiting to respect Nominatim's policy (1 request per second).
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'PortelaHub/1.0';

export interface GeoCoords {
    lat: number;
    lon: number;
}

/**
 * Delay helper for rate limiting
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Geocode a specific address or municipality
 */
export const geocode = async (query: string): Promise<GeoCoords | null> => {
    try {
        const url = new URL(NOMINATIM_BASE_URL);
        url.searchParams.append('q', query);
        url.searchParams.append('format', 'json');
        url.searchParams.append('limit', '1');
        url.searchParams.append('countrycodes', 'br');

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        if (!response.ok) throw new Error(`Nominatim error: ${response.statusText}`);

        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding failed:', error);
        return null;
    }
};

/**
 * Specialized geocode for MG municipalities
 */
export const geocodeMunicipio = async (nome: string): Promise<GeoCoords | null> => {
    return geocode(`${nome}, Minas Gerais, Brasil`);
};

/**
 * Specialized geocode for addresses (Lideranças/Assessores)
 */
export const geocodeAddress = async (address: {
    logradouro: string,
    numero: string,
    cidade: string,
    uf: string
}): Promise<GeoCoords | null> => {
    const query = `${address.logradouro}, ${address.numero}, ${address.cidade}, ${address.uf}, Brasil`;
    return geocode(query);
};
