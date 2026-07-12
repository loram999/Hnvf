const axios = require('axios');

function resultFromHash(hash) {
    const part = hash.length > 16 ? hash.slice(16) : hash;
    for (let i = part.length - 1; i >= 0; i--) {
        const ch = part[i];
        if (ch >= "0" && ch <= "9") return parseInt(ch, 10);
    }
    for (let i = hash.length - 1; i >= 0; i--) {
        const ch = hash[i];
        if (ch >= "0" && ch <= "9") return parseInt(ch, 10);
    }
    return 0;
}

function toPeriod(ts) {
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const h = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    return `${y}-${mo}-${day} ${h}:${mi}`;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const limit = parseInt(req.query.limit) || 100;
        const fetchLimit = Math.min(limit, 100);
        const upstreamUrl = `https://apilist.tronscanapi.com/api/block?sort=-number&start=0&limit=${fetchLimit}&_ts=${Date.now()}`;
        
        const response = await axios.get(upstreamUrl, { 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const rows = response.data.data || [];
        
        const list = rows.map(row => {
            const result = resultFromHash(row.hash);
            return {
                issueNumber: row.number.toString(),
                number: result.toString(),
                blockTime: toPeriod(row.timestamp)
            };
        });

        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ error: 'Fetch Failed', message: error.message });
    }
};
