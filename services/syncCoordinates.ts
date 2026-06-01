import { apiClient } from './apiClient';
import { geocodeMunicipio, geocodeAddress } from './geocodingService';

/**
 * Automation logic to sync coordinates from Nominatim to VPS PostgreSQL via API
 */

export const syncAllCoordinates = async () => {
    console.log('Starting coordinates sync...');

    // 1. Sync Municípios
    try {
        const municipios = await apiClient.get<any[]>('/api/municipios?latitude=null');

        if (municipios && Array.isArray(municipios)) {
            for (const m of municipios) {
                console.log(`Geocoding municipio: ${m.nome}`);
                const coords = await geocodeMunicipio(m.nome);
                if (coords) {
                    await apiClient.put(`/api/municipios/${m.id}`, {
                        latitude: coords.lat,
                        longitude: coords.lon
                    });
                }
                await new Promise(r => setTimeout(r, 1100)); // Respect Nominatim rate limit
            }
        }
    } catch (err) {
        console.error('Error syncing municipios coordinates:', err);
    }

    // 2. Sync Lideranças
    try {
        const liderancas = await apiClient.get<any[]>('/api/liderancas?latitude=null');

        if (liderancas && Array.isArray(liderancas)) {
            for (const l of liderancas) {
                if (l.endereco && l.endereco.logradouro) {
                    console.log(`Geocoding lideranca ID: ${l.id}`);
                    const coords = await geocodeAddress(l.endereco);
                    if (coords) {
                        await apiClient.put(`/api/liderancas/${l.id}`, {
                            latitude: coords.lat,
                            longitude: coords.lon
                        });
                    }
                    await new Promise(r => setTimeout(r, 1100));
                }
            }
        }
    } catch (err) {
        console.error('Error syncing liderancas coordinates:', err);
    }

    // 3. Sync Assessores
    try {
        const assessores = await apiClient.get<any[]>('/api/assessores?latitude=null');

        if (assessores && Array.isArray(assessores)) {
            for (const a of assessores) {
                if (a.endereco && a.endereco.logradouro) {
                    console.log(`Geocoding assessor ID: ${a.id}`);
                    const coords = await geocodeAddress(a.endereco);
                    if (coords) {
                        await apiClient.put(`/api/assessores/${a.id}`, {
                            latitude: coords.lat,
                            longitude: coords.lon
                        });
                    }
                    await new Promise(r => setTimeout(r, 1100));
                }
            }
        }
    } catch (err) {
        console.error('Error syncing assessores coordinates:', err);
    }

    console.log('Coordinates sync completed.');
};
