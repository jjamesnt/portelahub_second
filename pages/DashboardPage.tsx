
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import KpiCard from '../components/KpiCard';
import Loader from '../components/Loader';
import { getMunicipios, getMunicipiosSimples, getDashboardCounts, getDashboardLiderancas, getDashboardAssessores, getLiderancas, getAssessores, getAgendaEventos, getRecursosTotais, getDemandasTotais, getAllRecursos, getGoogleEvents } from '../services/api';
import { getElectoralEvents } from '../services/electoralCalendarService';
import ElectoralTimeline from '../components/ElectoralTimeline';

import { Municipio, Lideranca, Assessor, EventoAgenda, Recurso } from '../types';
import VotacaoEstadualKPIs from '../components/VotacaoEstadualKPIs';
import { mockLiderancas as mockLider } from '../data/mockLiderancas';
import { mockAssessores as mockAsse } from '../data/mockAssessores';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, LayersControl, LayerGroup, useMap, GeoJSON, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MG_GEOJSON, MG_MASK_COORDINATES } from '../constants/mgGeojson';

interface RecursoResumo extends Recurso {
    municipio_nome: string;
}

interface DashboardProps {
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
}

interface DashboardData {
    municipios: Municipio[];
    liderancas: Lideranca[];
    assessores: Assessor[];
    agenda: EventoAgenda[];
    recursosTotais: number;
    demandasTotais: number;
    aleDemandasCount: number;
    lincolnDemandasCount: number;
    recursos: RecursoResumo[];
}

const CoberturaMap: React.FC<{
    municipios: Municipio[],
    liderancas: Lideranca[],
    assessores: Assessor[],
    recursos: Recurso[],
    selectedMandato: string
}> = ({ municipios, liderancas, assessores, recursos, selectedMandato }) => {
    const { theme } = useContext(AppContext)!;
    // MG Coordinates center
    const center: [number, number] = [-18.5122, -44.5550];

    const stats = {
        totalRecursos: recursos.reduce((acc, r) => acc + r.valor, 0),
        municipiosAtendidos: new Set(recursos.map(r => r.municipioId)).size,
        projetosAtivos: recursos.filter(r => r.status !== 'Concluído').length
    };

    console.log('Map Data counts:', {
        municipios: municipios.length,
        liderancas: liderancas.length,
        assessores: assessores.length,
        withCoords: {
            liderancas: liderancas.filter(l => l.latitude != null && l.longitude != null).length,
            assessores: assessores.filter(a => a.latitude != null && a.longitude != null).length
        }
    });

    const ResizeMap = () => {
        const map = useMap();
        useEffect(() => {
            setTimeout(() => {
                map.invalidateSize();
            }, 500);
        }, [map]);
        return null;
    };

    return (
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm h-[600px] flex flex-col relative group/map">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-[1000]">
                <div>
                    <h4 className="font-bold text-navy-dark dark:text-white">Inteligência Territorial Portela App</h4>
                    <p className="text-xs text-slate-500">Mapa dinâmico de influência e alocação</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-1 flex gap-1">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Lideranças
                    </span>
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Assessores
                    </span>
                </div>
            </div>

            <div className="flex-1 z-0 relative">
                <MapContainer
                    center={center}
                    zoom={6}
                    style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
                    scrollWheelZoom={true}
                    className="map-pt-br-minimalist"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url={theme === 'dark' 
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        }
                    />

                    {/* Map Mask: Dims everything outside Minas Gerais */}
                    <Polygon
                        positions={MG_MASK_COORDINATES}
                        pathOptions={{
                            fillColor: theme === 'dark' ? '#0f172a' : '#f1f5f9',
                            fillOpacity: theme === 'dark' ? 0.7 : 0.8,
                            weight: 0,
                            stroke: false
                        }}
                    />

                    <GeoJSON
                        data={MG_GEOJSON as any}
                        style={{
                            color: "var(--color-primary)",
                            weight: 2,
                            fillColor: "var(--color-primary)",
                            fillOpacity: 0.05,
                            opacity: 0.8
                        }}
                    />
                    <ResizeMap />

                    <LayersControl position="topright">
                        <LayersControl.Overlay checked name="Lideranças">
                            <LayerGroup>
                                {liderancas.filter(l => l.latitude != null && l.longitude != null).map(lider => (
                                    <Marker
                                        key={`lider-${lider.id}`}
                                        position={[lider.latitude!, lider.longitude!]}
                                        zIndexOffset={100}
                                        icon={L.divIcon({
                                            className: 'lider-icon-marker',
                                            html: `
                                                <div class="relative flex items-center justify-center">
                                                    <div class="absolute w-6 h-6 bg-blue-500/20 rounded-full animate-ping"></div>
                                                    <div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); position: relative; z-index: 10;"></div>
                                                </div>
                                            `,
                                            iconSize: [24, 24],
                                            iconAnchor: [12, 12]
                                        })}
                                    >
                                        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg border border-slate-200 dark:border-slate-700">
                                                <p className="font-bold text-[10px] text-navy-dark dark:text-white m-0">{lider.nome}</p>
                                                <p className="text-[9px] text-slate-500 m-0">{lider.cargo} • {lider.municipio}</p>
                                            </div>
                                        </Tooltip>
                                        <Popup>
                                            <div className="p-2">
                                                <h5 className="font-bold border-b pb-1 mb-1">{lider.nome}</h5>
                                                <p className="text-xs m-0"><strong>Cargo:</strong> {lider.cargo}</p>
                                                <p className="text-xs m-0"><strong>Cidade:</strong> {lider.municipio}</p>
                                                <p className="text-xs m-0"><strong>Mandato:</strong> {lider.origem}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </LayerGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name="Assessores">
                            <LayerGroup>
                                {assessores.filter(a => a.latitude != null && a.longitude != null).map(assessor => (
                                    <Marker
                                        key={`assessor-${assessor.id}`}
                                        position={[assessor.latitude!, assessor.longitude!]}
                                        zIndexOffset={200}
                                        icon={L.divIcon({
                                            className: 'assessor-icon-marker',
                                            html: `
                                                <div class="relative flex items-center justify-center">
                                                    <div class="absolute w-6 h-6 bg-orange-500/20 rounded-full animate-ping"></div>
                                                    <div style="background-color: #f97316; width: 12px; height: 12px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); position: relative; z-index: 10;"></div>
                                                </div>
                                            `,
                                            iconSize: [24, 24],
                                            iconAnchor: [12, 12]
                                        })}
                                    >
                                        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg border border-orange-200 dark:border-orange-900/30">
                                                <p className="font-bold text-[10px] text-orange-600 dark:text-orange-400 m-0">{assessor.nome}</p>
                                                <p className="text-[9px] text-slate-500 m-0">Assessor • {assessor.regiaoAtuacao}</p>
                                            </div>
                                        </Tooltip>
                                        <Popup>
                                            <div className="p-2">
                                                <h5 className="font-bold text-orange-600 border-b pb-1 mb-1">{assessor.nome}</h5>
                                                <p className="text-xs m-0"><strong>Região:</strong> {assessor.regiaoAtuacao}</p>
                                                <p className="text-xs m-0"><strong>Municípios:</strong> {assessor.municipiosCobertos}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </LayerGroup>
                        </LayersControl.Overlay>

                        <LayersControl.Overlay checked name="Recursos (Municípios)">
                            <LayerGroup>
                                {municipios.filter(m => m.latitude && m.longitude).map(mun => (
                                    <Marker
                                        key={mun.id}
                                        position={[mun.latitude!, mun.longitude!]}
                                        icon={L.divIcon({
                                            className: 'municipio-icon',
                                            html: `
                                                <div class="relative flex items-center justify-center">
                                                    <div style="
                                                        background-color: rgba(20, 184, 166, 0.15); 
                                                        width: ${Math.min(32, (mun.totalRecursos || 0) / 50000 + 16)}px; 
                                                        height: ${Math.min(32, (mun.totalRecursos || 0) / 50000 + 16)}px; 
                                                        border-radius: 50%; 
                                                        border: 1px solid rgba(20, 184, 166, 0.4);
                                                        backdrop-filter: blur(1px);
                                                    "></div>
                                                    <div class="absolute w-2 h-2 bg-teal-500 rounded-full border border-white shadow-sm"></div>
                                                </div>
                                            `,
                                            iconSize: [32, 32],
                                            iconAnchor: [16, 16]
                                        })}
                                    >
                                        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg border border-teal-200 dark:border-teal-900/30">
                                                <p className="font-bold text-[10px] text-teal-600 dark:text-teal-400 m-0">{mun.nome}</p>
                                                <p className="text-[9px] text-slate-500 m-0">R$ {(mun.totalRecursos || 0).toLocaleString('pt-BR', { notation: 'compact' })} em recursos</p>
                                            </div>
                                        </Tooltip>
                                        <Popup>
                                            <div className="p-2">
                                                <h5 className="font-bold text-teal-600 border-b pb-1 mb-1">{mun.nome}</h5>
                                                <p className="text-xs m-0"><strong>Recursos:</strong> R$ {(mun.totalRecursos || 0).toLocaleString('pt-BR')}</p>
                                                <p className="text-xs m-0"><strong>Demandas:</strong> {mun.totalDemandas || 0}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </LayerGroup>
                        </LayersControl.Overlay>
                    </LayersControl>
                </MapContainer>

                {/* Recursos Cobertura Cards - Floating Overlay */}
                <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-none">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/20 dark:border-slate-700/50 shadow-2xl pointer-events-auto transition-transform hover:scale-105">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total em Recursos</p>
                        <p className="text-xl font-black text-turquoise tabular-nums">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.totalRecursos)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/20 dark:border-slate-700/50 shadow-xl pointer-events-auto flex-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cidades</p>
                            <p className="text-lg font-black text-navy-dark dark:text-white">{stats.municipiosAtendidos}</p>
                        </div>
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-white/20 dark:border-slate-700/50 shadow-xl pointer-events-auto flex-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Projetos</p>
                            <p className="text-lg font-black text-navy-dark dark:text-white">{stats.projetosAtivos}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



const AgendaSummary: React.FC<{ events: EventoAgenda[], isRefreshing: boolean, onRefresh: () => void, navigateTo: (page: string) => void }> = ({ events, isRefreshing, onRefresh, navigateTo }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
            <h4 className="font-bold text-navy-dark dark:text-white text-sm md:text-base">Resumo da Agenda</h4>
            <button
                onClick={onRefresh}
                className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
                title="Atualizar Agenda"
                disabled={isRefreshing}
            >
                <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
            </button>
        </div>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-2">event_busy</span>
                    <p className="text-xs font-bold uppercase tracking-wider">Sem eventos no período</p>
                </div>
            ) : (
                (() => {
                    const groups: { [key: string]: EventoAgenda[] } = {};
                    events.forEach(e => {
                        if (!groups[e.data]) groups[e.data] = [];
                        groups[e.data].push(e);
                    });

                    return Object.entries(groups).sort(([d1], [d2]) => d1.localeCompare(d2)).map(([date, dayEvents]) => (
                        <div key={date} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                </span>
                                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-700"></span>
                            </div>
                            {dayEvents.map((event, index) => {
                                const hasPrivateKeyword = (event.titulo + ' ' + (event.descricao || '')).toLowerCase().includes('privado') ||
                                    (event.titulo + ' ' + (event.descricao || '')).toLowerCase().includes('particular');
                                const isPrivate = event.privacidade === 'Particular' || hasPrivateKeyword;

                                return (
                                    <div key={event.id} className="flex gap-3 md:gap-4 items-start pl-1">
                                        <div className="shrink-0 flex flex-col items-center w-12">
                                            <span className={`text-[10px] md:text-xs font-bold uppercase ${event.hora === 'Dia Inteiro' ? 'text-turquoise' : 'text-slate-500'}`}>
                                                {event.hora === 'Dia Inteiro' ? 'DIA' : event.hora}
                                            </span>
                                            {index < dayEvents.length - 1 && <div className="w-px h-6 md:h-8 bg-slate-100 dark:bg-slate-700 mt-2 rounded-full"></div>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-xs md:text-sm font-bold truncate ${isPrivate ? 'text-slate-400 italic' : 'text-navy-dark dark:text-white'}`}>
                                                    {isPrivate ? "🔒 Reservado" : event.titulo}
                                                </p>
                                            </div>
                                            {!isPrivate && (
                                                <div className="flex flex-col gap-1 mt-0.5 md:mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-turquoise text-[12px] md:text-[14px]">location_on</span>
                                                        <p className="text-[10px] md:text-xs text-slate-500 truncate">{event.local || 'Não informado'}</p>
                                                    </div>
                                                    {event.origem === 'Justiça Eleitoral' && event.descricao && (
                                                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 leading-tight italic line-clamp-2 bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-md border-l-2 border-amber-500/50">
                                                            {event.descricao}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-1.5 mt-1.5">
                                                {event.origem === 'Lincoln Portela' && (
                                                    <span className="px-1.5 py-0.5 bg-[#8db641]/10 text-[#8db641] text-[8px] md:text-[9px] font-black rounded border border-[#8db641]/20 uppercase">
                                                        Lincoln
                                                    </span>
                                                )}
                                                {(event.origem === 'Alê Portela' || !event.origem || event.origem === 'Google Calendar' || event.origem === 'Justiça Eleitoral') && (
                                                    <span className={`px-1.5 py-0.5 text-[8px] md:text-[9px] font-black rounded border uppercase ${event.origem === 'Google Calendar'
                                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        : event.origem === 'Justiça Eleitoral'
                                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                            : 'bg-turquoise/10 text-turquoise border-turquoise/20'
                                                        }`}>
                                                        {event.origem === 'Google Calendar' ? 'Google' : (event.origem === 'Justiça Eleitoral' ? 'TSE' : 'Alê')}
                                                    </span>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ));
                })()
            )}
        </div>
        <div className="p-3 md:p-4 mt-auto border-t border-slate-200 dark:border-slate-700">
            <button
                onClick={() => navigateTo('Agenda')}
                className="w-full text-[10px] md:text-xs font-bold text-turquoise hover:underline flex items-center justify-center gap-1"
            >
                Ver Agenda Completa
                <span className="material-symbols-outlined text-sm md:text-xs">arrow_forward</span>
            </button>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: Municipio['statusAtividade'] }> = ({ status }) => {
    const styles = {
        'Consolidado': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        'Expansão': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        'Manutenção': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        'Atenção': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold tracking-wider ${styles[status]}`}>{status}</span>;
}

const RecursosDestaqueTable: React.FC<{ recursos: RecursoResumo[], navigateTo: DashboardProps['navigateTo'] }> = ({ recursos, navigateTo }) => {
    // Agregar recursos por município
    const recursosPorMunicipio = recursos.reduce((acc, recurso) => {
        const municipioName = recurso.municipio_nome || 'Não Identificado';
        if (!acc[municipioName]) {
            acc[municipioName] = {
                municipio: municipioName,
                totalValor: 0,
                quantidade: 0,
                origens: new Set<string>(),
                tipos: new Set<string>(),
                id: recurso.municipioId
            };
        }
        acc[municipioName].totalValor += recurso.valor;
        acc[municipioName].quantidade += 1;
        // Filtrar origem: apenas gabinetes (Portela)
        if (recurso.origem) {
            if (recurso.origem.toLowerCase().includes('portela')) {
                acc[municipioName].origens.add(recurso.origem);
            } else {
                acc[municipioName].tipos.add(recurso.origem);
            }
        }

        if (recurso.tipo) {
            // Se o tipo for uma string com vírgulas, quebrar e adicionar cada um
            recurso.tipo.split(',').forEach(t => acc[municipioName].tipos.add(t.trim()));
        }
        return acc;
    }, {} as Record<string, { municipio: string, totalValor: number, quantidade: number, origens: Set<string>, tipos: Set<string>, id: string }>);

    // Converter para array e ordenar por maior valor total
    const sortedMunicipios = Object.values(recursosPorMunicipio).sort((a, b) => b.totalValor - a.totalValor);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm mb-6 md:mb-8">
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
                <div>
                    <h4 className="font-extrabold text-navy-dark dark:text-white text-sm md:text-lg tracking-tight uppercase">Ranking de Recursos</h4>
                    <p className="text-slate-500 text-[10px] md:text-sm mt-0.5">Top municípios por volume de investimento</p>
                </div>
                <button
                    onClick={() => navigateTo('Recursos')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-navy-dark text-white rounded-lg text-xs font-semibold hover:bg-navy-dark/90 transition-colors shadow-lg shadow-navy-dark/10 w-full md:w-auto"
                >
                    <span className="material-symbols-outlined text-base">analytics</span>
                    Ver Tudo
                </button>
            </div>
            <div className="overflow-x-auto w-full scrollbar-hide">
                <table className="w-full text-left bg-white dark:bg-slate-800 min-w-[600px] md:min-w-0">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-4 md:px-6 py-3 w-8 md:w-12">#</th>
                            <th className="px-4 md:px-6 py-3">Município</th>
                            <th className="px-4 md:px-6 py-3 text-center">Origem</th>
                            <th className="px-4 md:px-6 py-3 text-center">Projetos</th>
                            <th className="px-4 md:px-6 py-3 text-right">Valor Total</th>
                            <th className="px-4 md:px-6 py-3 text-center w-10 md:w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {sortedMunicipios.slice(0, 5).map((item, index) => (
                            <tr key={item.municipio} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-4 md:px-6 py-2 md:py-3">
                                    <span className={`font-black text-[10px] md:text-xs ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-400' : 'text-slate-300'}`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3">
                                    <span
                                        className="font-semibold text-navy-dark dark:text-white text-xs md:text-sm whitespace-nowrap cursor-pointer hover:text-turquoise transition-colors"
                                        onClick={() => navigateTo('MunicipioDetalhes', { id: item.id })}
                                    >
                                        {item.municipio}
                                    </span>
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                    <div className="flex justify-center gap-1">
                                        {Array.from(item.origens).map(origem => (
                                            <span
                                                key={origem}
                                                className={`px-1 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase border ${origem === 'Lincoln Portela'
                                                    ? 'bg-navy-dark/10 text-navy-dark border-navy-dark/20 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30'
                                                    : 'bg-turquoise/10 text-turquoise border-turquoise/20 dark:bg-turquoise/20 dark:text-turquoise dark:border-turquoise/30'
                                                    }`}
                                            >
                                                {origem.split(' ')[0]}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                    <span className="inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] md:text-xs font-bold">
                                        {item.quantidade}
                                    </span>
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3 font-black text-xs md:text-sm text-navy-dark dark:text-white text-right whitespace-nowrap">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(item.totalValor)}
                                </td>
                                <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                    <button
                                        onClick={() => navigateTo('MunicipioDetalhes', { id: item.id })}
                                        className="size-6 md:size-7 rounded-lg bg-turquoise/10 hover:bg-turquoise/20 flex items-center justify-center transition-all group/btn"
                                    >
                                        <span className="material-symbols-outlined text-turquoise text-[14px] md:text-sm group-hover/btn:scale-110 transition-transform">open_in_new</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const RecentActivity = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col mb-6 md:mb-8">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h4 className="font-bold text-navy-dark dark:text-white text-sm md:text-base">Atividades Recentes</h4>
        </div>
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="relative flex gap-3 md:gap-4">
                <div className="absolute left-3 md:left-4 top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="shrink-0 size-6 md:size-8 rounded-full bg-turquoise/20 flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-turquoise text-xs md:text-sm">person_add</span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-navy-dark dark:text-white truncate">Nova Liderança</p>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">João Silva adicionou um novo líder em <span className="text-turquoise font-medium">Contagem</span>.</p>
                    <p className="text-[8px] md:text-[9px] text-slate-400 uppercase mt-1.5 font-bold tracking-wider">Há 5 min</p>
                </div>
            </div>
            <div className="relative flex gap-3 md:gap-4">
                <div className="absolute left-3 md:left-4 top-8 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="shrink-0 size-6 md:size-8 rounded-full bg-turquoise/20 flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-turquoise text-xs md:text-sm">description</span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-navy-dark dark:text-white truncate">Ofício Enviado</p>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Relatório ministerial concluído em <span className="text-turquoise font-medium">Betim</span>.</p>
                    <p className="text-[8px] md:text-[9px] text-slate-400 uppercase mt-1.5 font-bold tracking-wider">Há 42 min</p>
                </div>
            </div>
            <div className="relative flex gap-3 md:gap-4">
                <div className="shrink-0 size-6 md:size-8 rounded-full bg-turquoise/20 flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-turquoise text-xs md:text-sm">edit</span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-navy-dark dark:text-white truncate">Perfil Atualizado</p>
                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Assessor Marcos atualizou os dados de 15 líderes.</p>
                    <p className="text-[8px] md:text-[9px] text-slate-400 uppercase mt-1.5 font-bold tracking-wider">Há 5 horas</p>
                </div>
            </div>
        </div>
        <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-700">
            <button className="w-full text-[10px] md:text-xs font-bold text-turquoise hover:underline flex items-center justify-center gap-1">
                Ver Histórico
                <span className="material-symbols-outlined text-sm md:text-xs">arrow_forward</span>
            </button>
        </div>
    </div>
);


const DashboardPage: React.FC<DashboardProps> = ({ navigateTo }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isAgendaRefreshing, setIsAgendaRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { selectedMandato, setSelectedMandato } = useContext(AppContext)!;
    const isMounted = React.useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchDashboardData = async (agendaOnly = false) => {
        try {
            if (agendaOnly) setIsAgendaRefreshing(true);
            else setIsLoading(true);

            // Helpers para datas
            const today = new Date();
            const twoDaysAgo = new Date(today);
            twoDaysAgo.setDate(today.getDate() - 2);
            const fifteenDaysAhead = new Date(today);
            fifteenDaysAhead.setDate(today.getDate() + 15);

            const formatLocalISO = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startDate = formatLocalISO(twoDaysAgo);
            const endDate = formatLocalISO(fifteenDaysAhead);

            const helperFilterAndSortAgenda = (items: EventoAgenda[]) => {
                return items
                    .filter(event => {
                        if (event.origem === 'Justiça Eleitoral') return true;
                        return event.data >= startDate && event.data <= endDate;
                    })
                    .sort((a, b) => {
                        if (a.data !== b.data) return a.data.localeCompare(b.data);
                        if (a.hora === 'Dia Inteiro' && b.hora !== 'Dia Inteiro') return -1;
                        if (a.hora !== 'Dia Inteiro' && b.hora === 'Dia Inteiro') return 1;
                        return a.hora.localeCompare(b.hora);
                    })
                    .slice(0, 15);
            };

            // 1. CARGA RÁPIDA (KPIs e Dados Essenciais)
            const [
                municipiosSimples,
                liderancasData,
                assessoresData,
                agendaData,
                countsData
            ] = await Promise.all([
                (agendaOnly ? Promise.resolve(data?.municipios || []) : getMunicipiosSimples()).catch(err => { console.error("Erro Municípios Simples:", err); return []; }),
                (agendaOnly ? Promise.resolve(data?.liderancas || []) : getDashboardLiderancas()).catch(err => { console.error("Erro Lideranças:", err); return []; }),
                (agendaOnly ? Promise.resolve(data?.assessores || []) : getDashboardAssessores()).catch(err => { console.error("Erro Assessores:", err); return []; }),
                getAgendaEventos().catch(err => { console.error("Erro Agenda:", err); return []; }),
                (agendaOnly ? Promise.resolve(null) : getDashboardCounts()).catch(err => { console.error("Erro Counts:", err); return null; })
            ]);
            
            // Atribui os counts se disponíveis
            const recursosTotaisData = countsData?.recursosTotal ?? (data?.recursosTotais || 0);
            const demandasTotaisData = countsData?.demandasTotal ?? (data?.demandasTotais || 0);
            const municipiosCount = countsData?.municipiosCount ?? (data?.municipios?.length || 0);
            const liderancasCount = countsData?.liderancasCount ?? (data?.liderancas?.length || 0);
            const assessoresCount = countsData?.assessoresCount ?? (data?.assessores?.length || 0);
            const aleDemandasCount = countsData?.aleDemandasCount ?? (data?.aleDemandasCount || 0);
            const lincolnDemandasCount = countsData?.lincolnDemandasCount ?? (data?.lincolnDemandasCount || 0);

            const electoralEvents = getElectoralEvents();
            const nextElectoralEvents = electoralEvents
                .filter(e => e.data >= startDate)
                .sort((a, b) => a.data.localeCompare(b.data))
                .slice(0, 2);

            if (isMounted.current) {
                setData({
                    municipios: municipiosSimples,
                    liderancas: liderancasData.map(l => {
                        if (l.latitude == null) {
                            const mock = mockLider.find(ml => ml.id === l.id || ml.nome === l.nome);
                            if (mock) return { ...l, latitude: mock.latitude, longitude: mock.longitude };
                        }
                        return l;
                    }),
                    assessores: assessoresData.map(a => {
                        if (a.latitude == null) {
                            const mock = mockAsse.find(ma => ma.id === a.id || ma.nome === a.nome);
                            if (mock) return { ...a, latitude: mock.latitude, longitude: mock.longitude };
                        }
                        return a;
                    }),
                    agenda: helperFilterAndSortAgenda([...agendaData, ...nextElectoralEvents]),
                    recursosTotais: recursosTotaisData,
                    demandasTotais: demandasTotaisData,
                    aleDemandasCount: aleDemandasCount,
                    lincolnDemandasCount: lincolnDemandasCount,
                    recursos: data?.recursos || []
                });
                setIsLoading(false); // Libera a UI agora!
                setError(null);
            }

            // 2. CARGA PESADA EM BACKGROUND (Municípios Detalhados, Lideranças Completas, Assessores e Lista de Recursos)
            if (!agendaOnly) {
                Promise.all([
                    getMunicipios(),
                    getLiderancas(),
                    getAssessores(),
                    getAllRecursos()
                ]).then(([fullMunicipios, fullLiderancas, fullAssessores, fullRecursos]) => {
                    if (isMounted.current) {
                        setData(prev => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                municipios: fullMunicipios,
                                liderancas: fullLiderancas,
                                assessores: fullAssessores,
                                recursos: fullRecursos.map(r => ({
                                    ...r,
                                    municipio_nome: fullMunicipios.find(m => m.id === r.municipioId)?.nome || 'Desconhecido'
                                }))
                            };
                        });
                    }
                }).catch(err => console.error("Erro no carregamento pesado:", err));
            }

            // 3. GOOGLE CALENDAR EM BACKGROUND
            getGoogleEvents().then(googleEventsData => {
                if (googleEventsData.length > 0 && isMounted.current) {
                    setData(prev => {
                        if (!prev) return null;
                        const existingIds = new Set(prev.agenda.map(e => e.id));
                        const uniqueGoogle = googleEventsData.filter(e => !existingIds.has(e.id));
                        const fullAgenda = [...agendaData, ...nextElectoralEvents, ...uniqueGoogle];
                        return {
                            ...prev,
                            agenda: helperFilterAndSortAgenda(fullAgenda)
                        };
                    });
                }
            }).catch(err => console.error("Erro secundário Google Agenda:", err));

        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            if (isMounted.current) {
                setError(err.message || 'Erro ao carregar dados do dashboard');
            }
        } finally {
            if (isMounted.current) {
                setIsAgendaRefreshing(false);
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // Safety timeout agressivo para o Dashboard (8 segundos)
        const timer = setTimeout(() => {
            if (isMounted.current && isLoading) {
                console.warn("[Dashboard] Carregamento forçado via safety timeout (8s).");
                setIsLoading(false);
            }
        }, 8000);

        fetchDashboardData();

        // Auto-refresh every 5 minutes
        const intervalId = setInterval(() => {
            if (isMounted.current) fetchDashboardData(true);
        }, 5 * 60 * 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(intervalId);
        };
    }, []);

    const handleManualRefresh = () => {
        fetchDashboardData(true);
    };



    if (isLoading) return <Loader />;

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">error</span>
                <h3 className="text-xl font-bold text-navy-dark dark:text-white mb-2">Ops! Algo deu errado.</h3>
                <p className="text-slate-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-turquoise text-white rounded-lg font-bold hover:brightness-110"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <div className="min-w-0">
                    <h2 className="text-xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white truncate">Dashboard Geral</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-base">Visão estratégica e indicadores.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-sm text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
                    <span className="material-symbols-outlined text-turquoise text-base md:text-lg">calendar_today</span>
                    <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                </div>
            </div>

            <ElectoralTimeline
                onEventClick={(e) => navigateTo('Agenda', { eventId: e.id })}
                onViewFullCalendar={() => navigateTo('Agenda')}
            />


            {/* Filtrando dados para exibição */}
            {(() => {
                const filteredData = data ? {
                    ...data,
                    municipios: data.municipios, // Municípios são compartilhados
                    liderancas: selectedMandato === 'Todos' ? data.liderancas : data.liderancas.filter(l => {
                        const origem = (l.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        return origem.includes(filter) || 
                               (filter.includes('ale') && origem.includes('ale')) ||
                               (filter.includes('lincoln') && origem.includes('lincoln')) ||
                               (filter.includes('marilda') && origem.includes('marilda'));
                    }),
                    assessores: data.assessores, // Assessores são compartilhados
                    agenda: selectedMandato === 'Todos' ? data.agenda : data.agenda.filter(e => {
                        const origem = (e.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        const isMandatoMatch = !selectedMandato ||
                            selectedMandato === 'Ambos' ||
                            origem.includes(filter) ||
                            (filter.includes('ale') && origem.includes('ale')) ||
                            (filter.includes('lincoln') && origem.includes('lincoln')) ||
                            (filter.includes('marilda') && origem.includes('marilda'));
                        return e.origem === 'Google Calendar' || isMandatoMatch;
                    }),
                    recursos: selectedMandato === 'Todos' ? data.recursos : data.recursos.filter(r => {
                        const origem = (r.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        return origem.includes(filter) || 
                               (filter.includes('ale') && origem.includes('ale')) ||
                               (filter.includes('lincoln') && origem.includes('lincoln')) ||
                               (filter.includes('marilda') && origem.includes('marilda'));
                    }),
                    recursosTotais: selectedMandato === 'Todos' ? data.recursosTotais : data.recursos.filter(r => {
                        const origem = (r.origem as string || '').toLowerCase();
                        const filter = selectedMandato.toLowerCase();
                        return origem.includes(filter) || 
                               (filter.includes('ale') && origem.includes('ale')) ||
                               (filter.includes('lincoln') && origem.includes('lincoln')) ||
                               (filter.includes('marilda') && origem.includes('marilda'));
                    }).reduce((acc, r) => acc + r.valor, 0),
                    demandasTotais: selectedMandato === 'Todos' ? data.demandasTotais : (selectedMandato === 'Alê Portela' ? data.aleDemandasCount : (selectedMandato === 'Lincoln Portela' ? data.lincolnDemandasCount : 0)),
                } : null;

                if (!filteredData) return null;

                return (
                    <div className="space-y-8 animate-in fade-in duration-300">

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                            <KpiCard
                                title="Municípios"
                                value={filteredData.municipios.length.toString()}
                                icon="location_on"
                                trend="+2 este mês"
                                trendDirection="up"
                            />
                            <KpiCard
                                title="Lideranças"
                                value={filteredData.liderancas.length.toString()}
                                icon="groups"
                                trend="+12%"
                                trendDirection="up"
                            />
                            <KpiCard
                                title="Recursos"
                                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(filteredData.recursosTotais)}
                                icon="payments"
                                trend="85%"
                                trendDirection="neutral"
                            />
                            <KpiCard
                                title="Demandas"
                                value={(filteredData.demandasTotais || 0).toString()}
                                icon="assignment_late"
                                trend="-5 hoje"
                                trendDirection="up"
                            />
                        </div>

                        <VotacaoEstadualKPIs selectedMandato={selectedMandato} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <CoberturaMap
                                municipios={filteredData.municipios}
                                liderancas={filteredData.liderancas}
                                assessores={filteredData.assessores}
                                recursos={filteredData.recursos}
                                selectedMandato={selectedMandato}
                            />
                            <AgendaSummary
                                events={filteredData.agenda}
                                isRefreshing={isAgendaRefreshing}
                                onRefresh={handleManualRefresh}
                                navigateTo={navigateTo}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <RecursosDestaqueTable recursos={filteredData.recursos} navigateTo={navigateTo} />
                            </div>
                            <div>
                                <RecentActivity />
                            </div>
                        </div>
                    </div>
                );
            })()
            }
        </div >
    );
};

export default DashboardPage;
