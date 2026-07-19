const https = require('https');

exports.handler = async function(event, context) {
    const text = event.queryStringParameters.text;
    const lang = event.queryStringParameters.lang || 'vi';

    if (!text) {
        return { statusCode: 400, body: "Missing text parameter" };
    }

    const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;

    return new Promise((resolve) => {
        const options = {
            headers: {
                // Giả danh trình duyệt Chrome Windows để lách bộ lọc Bot của Google
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://translate.google.com/"
            }
        };

        https.get(targetUrl, options, (res) => {
            // Nếu Google vẫn chặn, trả về lỗi để web biết đường bắt Fallback
            if (res.statusCode !== 200) {
                resolve({ 
                    statusCode: res.statusCode, 
                    body: `Google API Error: ${res.statusCode}` 
                });
                return;
            }

            const data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(data);
                resolve({
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'audio/mpeg',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: buffer.toString('base64'),
                    isBase64Encoded: true
                });
            });
        }).on('error', (e) => {
            resolve({ statusCode: 500, body: e.message });
        });
    });
};