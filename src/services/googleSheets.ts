import type { User, Role, JourneyStep } from '../types';

const DEFAULT_SHEET_ID = '1twbpe7GYlgHkzRtOJ1p0ndS2Qh7MzHn1u5_XpwTyX0s';
const USERS_GID = '950125420'; // Usuarios y Beneficiarios
const COMPANIES_GID = '677976126'; // Base empresas
const DISPONIBILIDAD_GID = '868676344'; // Disponibilidad

export const JOURNEY_CONFIG = {
    '2025': '1356151252',
    '2026': '1478184624'
} as const;

export type JourneyYear = keyof typeof JOURNEY_CONFIG;

export const getSheetId = () => {
    return DEFAULT_SHEET_ID;
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
const parseCSV = (csv: string): Record<string, string>[] => {
    const lines = csv.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semiCount > commaCount ? ';' : ',';

    const parseLine = (line: string) => {
        const result: string[] = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') {
                cur += '"'; i++;
            } else if (char === '"') {
                inQuote = !inQuote;
            } else if (char === delimiter && !inQuote) {
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
    return lines.slice(1).map(line => {
        const values = parseLine(line);
        const obj: any = {};
        headers.forEach((header, i) => {
            if (header) {
                obj[header] = values[i] || '';
            }
        });
        return obj;
    });
};

export const syncUsersFromSheet = async (): Promise<User[]> => {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${getSheetId()}/export?format=csv&gid=${USERS_GID}&t=${Date.now()}`;
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

export const syncJourneysFromSheet = async (year: JourneyYear = '2026'): Promise<JourneyStep[]> => {
    try {
        const gid = JOURNEY_CONFIG[year];
        const url = `https://docs.google.com/spreadsheets/d/${getSheetId()}/export?format=csv&gid=${gid}&t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch journeys for ${year} from Google Sheets`);
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
        const url = `https://docs.google.com/spreadsheets/d/${getSheetId()}/export?format=csv&gid=${COMPANIES_GID}&t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch companies from Google Sheets');
        const csvText = await response.text();
        const rawData = parseCSV(csvText);

        return rawData.map((row: Record<string, any>, index: number) => {
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

export const syncAvailabilityFromSheet = async (): Promise<any[]> => {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${getSheetId()}/export?format=csv&gid=${DISPONIBILIDAD_GID}&t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch availability from Google Sheets');
        const csvText = await response.text();
        const rawData = parseCSV(csvText);

        return rawData.map((row: any) => ({
            userName: row['Nombre'] || row['UserName'] || '',
            userEmail: row['Correo'] || row['UserEmail'] || '',
            userRole: row['Rol'] || row['UserRole'] || '',
            date: row['Fecha'] || row['Date'] || '',
            startTime: row['Inicio'] || row['StartTime'] || '',
            endTime: row['Fin'] || row['EndTime'] || ''
        })).filter(s => s.userEmail !== '' && s.date !== '');
    } catch (error) {
        console.error('Availability Sync Error:', error);
        throw error;
    }
};

export const createSheetStructure = async (token: string, spreadsheetId: string) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

    const requests = [
        { addSheet: { properties: { title: 'Usuarios y Beneficiarios', gridProperties: { rowCount: 100, columnCount: 10 } } } },
        { addSheet: { properties: { title: 'Base empresas', gridProperties: { rowCount: 100, columnCount: 10 } } } },
        { addSheet: { properties: { title: 'Journey', gridProperties: { rowCount: 100, columnCount: 10 } } } },
        { addSheet: { properties: { title: 'Disponibilidad', gridProperties: { rowCount: 500, columnCount: 10 } } } }
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

export const getCachedJourneys = (year: JourneyYear = '2026'): JourneyStep[] => {
    const cached = localStorage.getItem(`synced_journeys_${year}`);
    return cached ? JSON.parse(cached) : [];
};

export const saveJourneysToCache = (journeys: JourneyStep[], year: JourneyYear = '2026') => {
    localStorage.setItem(`synced_journeys_${year}`, JSON.stringify(journeys));
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

export const getCachedAvailability = (): any[] => {
    const cached = localStorage.getItem('synced_availability');
    return cached ? JSON.parse(cached) : [];
};

export const saveAvailabilityToCache = (availability: any[]) => {
    localStorage.setItem('synced_availability', JSON.stringify(availability));
};

export const saveAvailabilityToSheet = async (token: string, spreadsheetId: string, availabilityData: any[]) => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Disponibilidad'!A2:F?valueInputOption=USER_ENTERED`;

    // Clear existing data first (optional, but requested structure seems like a clean sync)
    // Actually, usually for availability we might want to APPEND or OVERWRITE.
    // The user said "de ahora en adelante, lo que guarden será guardado en esta tabla".
    // I'll overwrite the whole table for simplicity unless I see an append need.

    const rows = availabilityData.map(slot => [
        slot.userName,
        slot.userEmail,
        slot.userRole,
        slot.date,
        slot.startTime,
        slot.endTime
    ]);

    // To prevent clearing the header, we'll just PUT to A2
    await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ values: rows })
    });

    return true;
};
