import type { User, Role, JourneyStep } from '../types';

const DEFAULT_SHEET_ID = '1UwExj6WycmRdKj5Ik_oetB1TnLCKo1bLKs2lo_KCLYg';
const USERS_GID = '0'; // Usuarios y Beneficiarios
const JOURNEYS_GID = '2104648175'; // Journey
const COMPANIES_GID = '782223446'; // Base empresas

export const getSheetId = () => {
    return localStorage.getItem('google_sheet_id') || DEFAULT_SHEET_ID;
};

export const saveSheetId = (id: string) => {
    localStorage.setItem('google_sheet_id', id);
};

// Mapping from Sheet Role names to our internal Role type
const ROLE_MAP: Record<string, Role> = {
    'Gestor': 'MANAGER',
    'Administrador': 'ADMIN',
    'Mentor': 'MENTOR',
    'Asesor': 'ADVISOR',
    'Coach': 'COACH',
    'Empresa': 'ENTREPRENEUR',
    'Emprendedor': 'ENTREPRENEUR'
};

/**
 * Simple CSV Parser to avoid external dependencies
 */
const parseCSV = (csv: string) => {
    const lines = csv.split(/\r?\n/);
    if (lines.length === 0) return [];

    // Support for quoted commas
    const parseLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') {
                cur += '"'; i++;
            } else if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result;
    };

    const headers = parseLine(lines[0]);
    return lines.slice(1).filter(line => line.trim()).map(line => {
        const values = parseLine(line);
        const obj: any = {};
        headers.forEach((header, i) => {
            obj[header] = values[i];
        });
        return obj;
    });
};

export const syncUsersFromSheet = async (): Promise<User[]> => {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${getSheetId()}/export?format=csv&gid=${USERS_GID}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch users from Google Sheets');
        const csvText = await response.text();
        const rawData = parseCSV(csvText);

        // Map to our User type
        return rawData.map((row: any, index: number) => {
            const email = row['Correo electrónico'] || row['Correo'] || row['Email'];
            const rawRole = row['Rol'] || 'ENTREPRENEUR';
            const role = ROLE_MAP[rawRole] || 'ENTREPRENEUR';

            return {
                id: `sheet-${index}`,
                name: row['Nombre'] || row['Nombre completo'] || email?.split('@')[0] || 'Usuario',
                email: email || '',
                role: role
            };
        }).filter(u => u.email !== '');
    } catch (error) {
        console.error('Sync Error:', error);
        throw error;
    }
};

export const syncJourneysFromSheet = async (): Promise<JourneyStep[]> => {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${getSheetId()}/export?format=csv&gid=${JOURNEYS_GID}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch journeys from Google Sheets');
        const csvText = await response.text();
        const rawData = parseCSV(csvText);

        return rawData.map((row: any, index: number) => {
            return {
                id: row['Código'] || row['ID'] || `step-${index}`,
                fase: row['Fase'] || '',
                stage: row['Etapa'] || 'General',
                month: row['Mes'] || '',
                type: row['Tipo'] || row['Tipo de actividad'] || 'Sesión',
                hours: parseInt(row['Horas (h)']) || parseInt(row['Horas']) || 0,
                additional: row['Adicional'] || '',
                description: row['Descripción de la actividad'] || row['Actividad'] || '',
                deliverable: row['Entregable'] || '',
                cohort1: {
                    week: row['Semana del 2026 cohorte 1'] || '',
                    startDate: row['Fecha inicio (C1)'] || row['Fecha inicio'] || '',
                    month: row['Mes (C1)'] || row['Mes'] || ''
                },
                cohort2: {
                    week: row['Semana del 2026 cohorte 2'] || '',
                    startDate: row['Fecha inicio (C2)'] || '',
                    month: row['Mes (C2)'] || ''
                }
            };
        }).filter(s => s.description !== '');
    } catch (error) {
        console.error('Journey Sync Error:', error);
        throw error;
    }
};

export const syncCompaniesFromSheet = async (): Promise<any[]> => {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${getSheetId()}/export?format=csv&gid=${COMPANIES_GID}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch companies from Google Sheets');
        const csvText = await response.text();
        const rawData = parseCSV(csvText);

        return rawData.map((row: any, index: number) => {
            const rowId = row['ID'];
            const nextId = (index + 1).toString().padStart(3, '0');
            return {
                id: rowId && rowId.trim() !== '' ? rowId : `EMP-${nextId}`,
                name: row['Razón social'] || row['Empresa'] || 'Empresa sin nombre',
                nit: row['NIT'] || '',
                email: row['Correo'] || '',
                phone: row['Teléfono'] || '',
                address: row['Dirección'] || ''
            };
        });
    } catch (error) {
        console.error('Company Sync Error:', error);
        throw error;
    }
};

export const createSheetStructure = async (token: string, spreadsheetId: string) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

    const requests = [
        { addSheet: { properties: { title: 'Usuarios y Beneficiarios', gridProperties: { rowCount: 100, columnCount: 10 } } } },
        { addSheet: { properties: { title: 'Base empresas', gridProperties: { rowCount: 100, columnCount: 10 } } } },
        { addSheet: { properties: { title: 'Journey', gridProperties: { rowCount: 100, columnCount: 10 } } } }
    ];

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requests })
    });

    if (!response.ok) {
        const err = await response.json();
        if (!err.error?.message?.includes('already exists')) throw new Error('Failed to create sheets');
    }

    // Now add headers for each sheet
    const valueUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const headerData = [
        { range: "'Usuarios y Beneficiarios'!A1", values: [['Nombre', 'Correo electrónico', 'Rol']] },
        { range: "'Base empresas'!A1", values: [['ID', 'Razón social', 'NIT', 'Correo', 'Teléfono', 'Dirección']] },
        {
            range: "'Journey'!A1",
            values: [[
                'Fase', 'Etapa', 'Mes', 'Código', 'Tipo', 'Horas (h)', 'Adicional',
                'Descripción de la actividad', 'Entregable',
                'Semana del 2026 cohorte 1', 'Fecha inicio (C1)', 'Mes (C1)',
                'Semana del 2026 cohorte 2', 'Fecha inicio (C2)', 'Mes (C2)'
            ]]
        }
    ];

    await fetch(valueUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            valueInputOption: 'RAW',
            data: headerData
        })
    });

    return true;
};

export const migrateExampleData = async (token: string, spreadsheetId: string) => {
    // Source Sheets IDs
    const SOURCE_ID = DEFAULT_SHEET_ID;
    const sources = [
        { name: 'Usuarios y Beneficiarios', gid: '0' },
        { name: 'Base empresas', gid: '782223446' },
        { name: 'Journey', gid: '2104648175' }
    ];

    for (const source of sources) {
        const fetchUrl = `https://docs.google.com/spreadsheets/d/${SOURCE_ID}/export?format=csv&gid=${source.gid}`;
        const res = await fetch(fetchUrl);
        if (!res.ok) continue;

        const csvText = await res.text();
        const rows = csvText.split('\n').map(row => {
            // Handle quotes and commas simply for this migration
            return row.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
        });

        // Push to target via API
        const targetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${source.name}'!A1?valueInputOption=USER_ENTERED`;
        await fetch(targetUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ values: rows })
        });
    }

    return true;
};

export const getCachedJourneys = (): JourneyStep[] => {
    const cached = localStorage.getItem('synced_journeys');
    return cached ? JSON.parse(cached) : [];
};

export const saveJourneysToCache = (journeys: JourneyStep[]) => {
    localStorage.setItem('synced_journeys', JSON.stringify(journeys));
};
export const getCachedUsers = (): User[] => {
    const cached = localStorage.getItem('synced_users');
    return cached ? JSON.parse(cached) : [];
};

export const saveUsersToCache = (users: User[]) => {
    localStorage.setItem('synced_users', JSON.stringify(users));
};

export const getCachedCompanies = (): any[] => {
    const cached = localStorage.getItem('synced_companies');
    return cached ? JSON.parse(cached) : [];
};

export const saveCompaniesToCache = (companies: any[]) => {
    localStorage.setItem('synced_companies', JSON.stringify(companies));
};
