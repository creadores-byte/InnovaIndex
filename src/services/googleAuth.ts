const CLIENT_ID = '763784289285-rm7nn1l6496n8ltp4bbsmkaoqn0oo24q.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient: any = null;
let accessToken: string | null = null;

export const initGoogleAuth = () => {
    return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    if (response.error !== undefined) {
                        throw response;
                    }
                    accessToken = response.access_token;
                    localStorage.setItem('google_access_token', response.access_token);
                    resolve();
                },
            });
            resolve();
        };
        document.body.appendChild(script);
    });
};

export const requestAccessToken = () => {
    return new Promise<string>((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Google Auth not initialized'));
            return;
        }

        tokenClient.callback = (response: any) => {
            if (response.error !== undefined) {
                reject(response);
                return;
            }
            accessToken = response.access_token;
            localStorage.setItem('google_access_token', response.access_token);
            resolve(response.access_token);
        };

        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

export const getAccessToken = () => accessToken || localStorage.getItem('google_access_token');

export const logoutGoogle = () => {
    accessToken = null;
    localStorage.removeItem('google_access_token');
};
