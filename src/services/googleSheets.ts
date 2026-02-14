import type { User, Role, JourneyStep } from '../types';

const DEFAULT_SHEET_ID = '1UwExj6WycmRdKj5Ik_oetB1TnLCKo1bLKs2lo_KCLYg';
const USERS_GID = '0'; // Usuarios y Beneficiarios
const JOURNEYS_GID = '2104648175'; // Journey

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
            const hours = parseInt(row['Horas']) || 0;
            return {
                id: row['ID'] || `step-${index}`,
                stage: row['Etapa'] || 'General',
                activity: row['Actividad'] || 'Sin nombre',
                type: row['Tipo de actividad'] || 'Sesión',
                weight: row['Peso porcentual'] || '0,00%',
                hours: hours
            };
        }).filter(s => s.activity !== 'Sin nombre');
    } catch (error) {
        console.error('Journey Sync Error:', error);
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
        { range: "'Base empresas'!A1", values: [['Empresa', 'NIT', 'Correo']] },
        { range: "'Journey'!A1", values: [['Etapa', 'Actividad', 'Peso porcentual', 'Horas']] }
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
