// Handler wrapper: CORS, method guard, and — the important part — error
// responses that are actually errors.
//
// The old handlers caught every failure and returned `success: true` with
// hardcoded fallback data. That is why a retired model went unnoticed for nine
// months. Failures are now loud.

export function handler(method, fn) {
    return async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        if (req.method === 'OPTIONS') return res.status(200).end();
        if (req.method !== method) {
            return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        try {
            const body = await fn(req.body || {}, req);
            return res.status(200).json({ success: true, ...body });
        } catch (error) {
            const status = Number.isInteger(error.status) ? error.status : 500;
            console.error(`[${req.url}] ${error.name}: ${error.message}`);
            return res.status(status).json({
                success: false,
                error: error.message || 'Internal server error',
                kind: error.name || 'Error'
            });
        }
    };
}
