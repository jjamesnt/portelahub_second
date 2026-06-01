
import { EventoAgenda } from '../types';

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;

const formatData = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const mockAgenda: EventoAgenda[] = [];
