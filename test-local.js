const lambda = require('./index');
const fs = require('fs');

// 創建測試事件
const event = {
  httpMethod: "POST",
  body: JSON.stringify({
    prompt: "Hello, what time is it?"
  })
};

// 設置API金鑰環境變量（請使用您的新API金鑰）
process.env.ANTHROPIC_API_KEY = 'YOUR_NEW_API_KEY';

// 調用Lambda處理函數
lambda.handler(event, {})
  .then(response => {
    console.log('Lambda Response:');
    console.log(JSON.stringify(response, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });