import { FormattedIBGEData } from '../types';

/**
 * Consulta indicadores socioeconômicos do IBGE para um município específico.
 * Indicadores:
 * 29171 - População (2022)
 * 47001 - PIB per capita (2021)
 * 29169 - Área Territorial
 * 29168 - Densidade Demográfica
 */
export const getIBGEData = async (codigoIBGE: string): Promise<FormattedIBGEData | null> => {
    if (!codigoIBGE) return null;

    const indicadores = '29171|47001|29169|29168';
    const url = `https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/${indicadores}/resultados/${codigoIBGE}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao buscar dados IBGE');

        const data = await response.json();

        const result: Partial<FormattedIBGEData> = {};

        data.forEach((indicator: any) => {
            const valor = indicator.res[0]?.res['2022'] || indicator.res[0]?.res['2021'] || Object.values(indicator.res[0]?.res)[0];

            switch (indicator.id) {
                case 29171: result.populacao = valor; break;
                case 47001: result.pibPerCapita = valor; break;
                case 29169: result.area = valor; break;
                case 29168: result.densidade = valor; break;
            }
        });

        return result as FormattedIBGEData;
    } catch (error) {
        console.error('Erro IBGE API:', error);
        return null;
    }
};
