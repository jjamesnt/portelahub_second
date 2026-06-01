
/**
 * Google Calendar Integration Service (Real Implementation)
 * 
 * Handles OAuth2 authentication and interaction with the Google Calendar API.
 * Supports multiple calendars as defined in VITE_GOOGLE_CALENDAR_IDS.
 */

import { EventoAgenda } from '../types';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

// Parse configured calendar IDs
const CALENDAR_IDS = (import.meta.env.VITE_GOOGLE_CALENDAR_IDS || 'primary').split(',').map(id => id.trim());

declare global {
    interface Window {
        gapi: any;
    }
}

interface GoogleEvent {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    visibility?: 'default' | 'public' | 'private' | 'confidential';
    start: { dateTime: string; timeZone: string; date?: string };
    end: { dateTime: string; timeZone: string; date?: string };
    htmlLink: string;
}

export const initGoogleClient = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!window.gapi) {
            reject(new Error("Google API script not loaded"));
            return;
        }

        window.gapi.load('client:auth2', async () => {
            try {
                await window.gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES,
                });
                resolve();
            } catch (error) {
                console.error("Error initializing Google Client:", error);
                reject(error);
            }
        });
    });
};

export const signIn = async (): Promise<any> => {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
        return authInstance.signIn();
    }
    return authInstance.currentUser.get();
};

export const signOut = async (): Promise<void> => {
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance.isSignedIn.get()) {
        await authInstance.signOut();
    }
};

export const isSignedIn = (): boolean => {
    return window.gapi?.auth2?.getAuthInstance()?.isSignedIn.get() || false;
};

// Map Google Event to App Event Type
const mapGoogleEventToApp = (gEvent: GoogleEvent, calendarId: string): EventoAgenda => {
    // Determine type based on summary or description keywords (Simple heuristic)
    let tipo: EventoAgenda['tipo'] = 'Reunião';
    const textRes = (gEvent.summary + ' ' + (gEvent.description || '')).toLowerCase();

    if (textRes.includes('visita') || textRes.includes('obra')) tipo = 'Visita Técnica';
    else if (textRes.includes('evento') || textRes.includes('inauguração')) tipo = 'Evento Público';
    else if (textRes.includes('plenária') || textRes.includes('sessão') || textRes.includes('votação')) tipo = 'Sessão Plenária';

    // Heurística de privacidade
    const isPrivate = gEvent.visibility === 'private' ||
        gEvent.visibility === 'confidential' ||
        textRes.includes('privado') ||
        textRes.includes('particular');

    // Normalização de data/hora sensível ao fuso horário local
    let dataIso = '';
    let hora = '';

    if (gEvent.start?.dateTime) {
        const dateObj = new Date(gEvent.start.dateTime);
        if (!isNaN(dateObj.getTime())) {
            // Conversão para horário local do navegador (Brasília -03:00)
            dataIso = dateObj.getFullYear() + '-' +
                String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
                String(dateObj.getDate()).padStart(2, '0');

            hora = String(dateObj.getHours()).padStart(2, '0') + ':' +
                String(dateObj.getMinutes()).padStart(2, '0');
        } else {
            dataIso = gEvent.start.dateTime.split('T')[0];
            hora = 'Dia Inteiro';
        }
    } else if (gEvent.start?.date) {
        // Formato: "2026-02-24" (Evento de dia inteiro)
        dataIso = gEvent.start.date;
        hora = 'Dia Inteiro';
    }

    // Determine source label
    let sourceLabel = '';
    let origem: EventoAgenda['origem'] = 'Alê Portela';

    if (calendarId.includes('ale') || calendarId === 'primary') {
        sourceLabel = '(Alê Portela)';
        origem = 'Alê Portela';
    } else if (calendarId.includes('lincoln')) {
        sourceLabel = '(Lincoln Portela)';
        origem = 'Lincoln Portela';
    }

    return {
        id: gEvent.id,
        titulo: gEvent.summary + (sourceLabel ? ` ${sourceLabel}` : ''),
        data: dataIso,
        hora: hora,
        tipo: tipo,
        local: isPrivate ? 'Local Reservado' : (gEvent.location || 'Não informado'),
        descricao: isPrivate ? undefined : gEvent.description,
        origem: origem,
        privacidade: isPrivate ? 'Particular' : 'Público'
    } as EventoAgenda;
};

export const listUpcomingGoogleEvents = async (maxResults: number = 100): Promise<EventoAgenda[]> => {
    if (!isSignedIn()) {
        console.warn("User not signed in to Google.");
        return [];
    }

    let allEvents: EventoAgenda[] = [];

    // Fetch from all configured calendars
    for (const calendarId of CALENDAR_IDS) {
        try {
            const response = await window.gapi.client.calendar.events.list({
                'calendarId': calendarId === 'primary' ? 'primary' : calendarId,
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': maxResults,
                'orderBy': 'startTime'
            });

            const events = response.result.items as GoogleEvent[];
            if (events && events.length > 0) {
                const mappedEvents = events.map(e => mapGoogleEventToApp(e, calendarId));
                allEvents = [...allEvents, ...mappedEvents];
            }
        } catch (err) {
            console.error(`Failed to fetch events for calendar ${calendarId}`, err);
        }
    }

    // Sort combined events by date/time
    return allEvents.sort((a, b) => {
        const dateA = new Date(`${a.data}T${a.hora}`);
        const dateB = new Date(`${b.data}T${b.hora}`);
        return dateA.getTime() - dateB.getTime();
    });
};

export const createGoogleEvent = async (event: Omit<EventoAgenda, 'id'>, calendarId: string = 'primary'): Promise<any> => {
    if (!isSignedIn()) throw new Error("Recurso disponível apenas com login Google ativado.");

    const resource = {
        summary: event.titulo,
        location: event.local,
        description: `Criado via Portela Hub. Tipo: ${event.tipo}`,
        start: {
            dateTime: `${event.data}T${event.hora}:00`,
            timeZone: 'America/Sao_Paulo' // Fixed for now, could be dynamic
        },
        end: {
            dateTime: `${event.data}T${parseInt(event.hora.split(':')[0]) + 1}:${event.hora.split(':')[1]}:00`, // Default 1 hour duration
            timeZone: 'America/Sao_Paulo'
        }
    };

    try {
        const response = await window.gapi.client.calendar.events.insert({
            'calendarId': calendarId,
            'resource': resource
        });
        return response.result;
    } catch (err) {
        console.error("Error creating Google Event:", err);
        throw err;
    }
};
