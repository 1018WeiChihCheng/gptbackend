const axios = require('axios');

exports.handler = async (event) => {
    // 設置CORS頭部
    const headers = {
        'Access-Control-Allow-Origin': 'http://chat-app-fe-deploy.s3-website-us-west-2.amazonaws.com',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Credentials': 'true'
    };
    
    // 處理OPTIONS請求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight responded successfully' })
        };
    }
    
    try {
        console.log('Received event:', JSON.stringify(event, null, 2)); // 記錄完整事件
        
        // 多方式嘗試獲取prompt
        let prompt;
        
        // 方法1: 直接從event.body解析
        if (event.body) {
            try {
                const parsedBody = JSON.parse(event.body);
                prompt = parsedBody.prompt;
                console.log('Found prompt in parsed body:', prompt);
            } catch (e) {
                console.log('Failed to parse event.body as JSON:', e.message);
                // 如果不是JSON，嘗試直接使用
                prompt = event.body.prompt;
            }
        }
        
        // 方法2: 如果event本身是一個對象並包含prompt
        if (!prompt && event.prompt) {
            prompt = event.prompt;
            console.log('Found prompt directly in event:', prompt);
        }
        
        // 方法3: 檢查是否在API Gateway測試控制台中
        if (!prompt && typeof event === 'object') {
            // 來自API Gateway測試控制台的特殊情況
            console.log('Checking for API Gateway test console format');
            prompt = event.prompt || 
                    (event.body && typeof event.body === 'string' && event.body.includes('prompt') ? 
                     JSON.parse(event.body).prompt : null);
        }
        
        // 確保我們有有效的prompt
        if (!prompt) {
            console.log('No prompt found in any expected location');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: '缺少prompt參數',
                    details: 'Request must include a prompt',
                    receivedEvent: JSON.stringify(event).substring(0, 200) // 添加部分事件信息幫助調試
                })
            };
        }
        
        // 使用環境變量獲取API金鑰
        const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
        
        if (!ANTHROPIC_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'API金鑰未設置',
                    details: 'Missing ANTHROPIC_API_KEY environment variable'
                })
            };
        }
        
        // 呼叫Claude API
        const axios = require('axios');
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [
                { role: 'user', content: prompt }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });
        
        // 從Claude API回應中提取內容
        const message = response.data.content[0].text;
        
        // 返回處理後的回應
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: message
            })
        };
    } catch (error) {
        console.error('Error:', error);
        
        // 返回錯誤訊息
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: '處理請求時發生錯誤',
                details: error.message,
                stack: error.stack // 添加堆疊信息以幫助調試
            })
        };
    }
};