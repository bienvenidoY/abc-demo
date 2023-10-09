const express = require('express');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');

const app = express();

async function startBrowser(port, proxy, proxyUsername, proxyPassword) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--remote-debugging-port=${port}`,
      `--proxy-server=${proxy}`
    ],
  });

  const page = (await browser.pages())[0];

  if (proxyUsername && proxyPassword) {
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword
    });
  }

  await page.goto('https://www.tiktok.com');

  // 返回 WebSocket 端点
  return browser.wsEndpoint();
}

app.get('/chrome', async (req, res) => {
  const port = req.query.port || 9222;
  const proxy = req.query.proxy || 'http://your-proxy-address:your-proxy-port';
  const proxyUsername = req.query.proxyUsername || 'your-username';
  const proxyPassword = req.query.proxyPassword || 'your-password';

  const wsEndpoint = await startBrowser(port, proxy, proxyUsername, proxyPassword);

  // 返回 WebSocket 端点的 JSON 格式
  res.json({ ws: wsEndpoint });
});


const PORT = process.env.PORT || 3000;
// 获取当前运行的所有进程
exec('netstat -tuln', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  // 检查是否有进程在监听端口 3000
  if (stdout.includes(`:${PORT}`)) {
    // 如果存在，关闭该进程
    exec(`lsof -t -i tcp:${PORT} | xargs kill`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      console.log(`Process on port ${PORT} has been closed.`);
    });
  } else {
    console.log(`No process found on port ${PORT}.`);
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// http://localhost:3000/chrome?port=9222&proxy=http%3A%2F%2F135.181.232.61%3A5959&proxyUsername=cca212-res-us-sid-22928254&proxyPassword=D6by9SNeCoEXjFA
// npm install express puppeteer
