const puppeteerExtra = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');

const {Random} = require('random-js');

puppeteerExtra.use(stealth());

const random = new Random();

// Constants
const URLS = {
  login: 'https://www.tiktok.com/explore',
  captchaGet: 'https://us.tiktok.com/captcha/get',
  captchaOversea: 'https://p16-security-va.ibyteimg.com/img/security-captcha-oversea-usa'
};

const VIEWPORT = {
  width: 900,
  height: 812
};

const CAPTCHA = {
  TYPE_DEFAULT: 0,
  TYPE_ROTATE: 2,
  TYPE_CLICK: 1
};

const IMG_CACHE = {
  url1: null,
  url2: null
};

let CAPTCHA_TYPE = CAPTCHA.TYPE_DEFAULT;

async function b64_api(img_b64 = null, large_b64 = null, small_b64 = null, username = 'jstsoso', password = 'cc123456', module_id = '07216914') {
  let data = {
    "username": username,
    "password": password,
    "ID": module_id,
    "b64": img_b64,
    "version": "3.1.1"
  };

  if (large_b64) {
    data['b64_large'] = large_b64;
  }
  if (small_b64) {
    data['b64_small'] = small_b64;
  }

  try {
    const response = await axios.post("http://www.fdyscloud.com.cn/tuling/predict", data);
    return response.data;
  } catch (error) {
    logger.error('Error in b64_api:', error.message);
    return null;
  }
}

async function getImageAsBase64(url) {
  try {
    const response = await axios.get(url, {responseType: 'arraybuffer'});
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return base64;
  } catch (error) {
    logger.error('Error fetching the image:', error.message);
    return null;
  }
}

const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, err) => {
    console.error(`[ERROR] ${message}`);
    if (err) console.error(err.stack || err);
  },
  debug: (message) => console.log(`[DEBUG] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`)  // 添加的warn方法

};

// Handlers
async function handleRotateCaptcha(page) {
  try {
    if (!IMG_CACHE.url1 || !IMG_CACHE.url2) {
      logger.error('Image URLs are missing in the cache.');
      return;
    }

    const large_b64 = await getImageAsBase64(IMG_CACHE.url1);
    const small_b64 = await getImageAsBase64(IMG_CACHE.url2);

    const result = await b64_api(null, large_b64, small_b64, 'jstsoso', 'cc123456', '47839879');
    console.log(result)
    if (!result || !result.data || typeof result.data['小圆顺时针旋转度数'] === 'undefined') {
      logger.error('Failed to get the rotation degree from the API.');
      return;
    }

    const degree = result.data['小圆顺时针旋转度数'];
    const offset = Math.floor((340 - 64.5) / 180 * degree / 2);

    const hk = await page.$x('//div[contains(@class,"captcha-drag-icon")]');
    if (hk.length === 0) {
      logger.error('Failed to find the captcha drag icon on the page.');
      return;
    }

    const hk_box = await hk[0].boundingBox();
    let start_x = hk_box.x;
    let start_y = hk_box.y;

    await page.mouse.move(start_x, start_y);
    await page.mouse.down();

    for (let i = 0; i < offset; i++) {
      await page.waitForTimeout(20);
      start_x += random.integer(2, 6);
      start_y += random.integer(-3, 3);

      if (start_y < hk_box.y - 3) {
        start_y = hk_box.y - 3;
      } else if (start_y > hk_box.y + 3) {
        start_y = hk_box.y + 3;
      }

      if (start_x > hk_box.x + offset) {
        start_x = hk_box.x + offset;
        await page.mouse.move(start_x, start_y);
        break;
      }
      await page.mouse.move(start_x, start_y);
    }
    await page.mouse.up()

    const verify_resp = await page.waitForResponse('https://us.tiktok.com/captcha/verify*');
    const verify_json = await verify_resp.json();
    if (!verify_json) {
      logger.error('Failed to get the verification response.');
      return;
    }
    logger.debug(verify_json);
  } catch (error) {
    logger.error(`Error handling the rotate captcha: ${error.message}`);
  }
}


async function handleClickCaptcha(page) {
  // ... Placeholder for the logic ...
}

const determineCaptchaType = (question) => {
  if (question.url1 && question.url2) {
    logger.info('旋转验证码');
    IMG_CACHE.url1 = question.url1;
    IMG_CACHE.url2 = question.url2;
    return CAPTCHA.TYPE_ROTATE;
  } else if (question.url1 && !question.url2) {
    logger.info('点选验证码');
    return CAPTCHA.TYPE_CLICK;
  }
  return CAPTCHA.TYPE_NONE;
}

const handleCaptchaByType = async (type, page) => {
  switch (type) {
    case CAPTCHA.TYPE_ROTATE:
      await handleRotateCaptcha(page);
      break;
    case CAPTCHA.TYPE_CLICK:
      await handleClickCaptcha(page);
      break;
    default:
      break;
  }
}

const responseHandler = async (response, page) => {
  const url = response.url();

  try {
    if (url.includes(URLS.captchaGet)) {
      const jsonData = await response.json();
      const question = jsonData.data?.question;
      if (question) {
        CAPTCHA_TYPE = determineCaptchaType(question);
      }
    }

    if (url.includes(URLS.captchaOversea)) {
      await handleCaptchaByType(CAPTCHA_TYPE, page);
    }
  } catch (error) {
    logger.error('Error handling response:', error.message);
  }
};


const randomSleep = async (page, min = 2000, max = 5000) => {
  const time = Math.random() * (max - min) + min;
  await page.waitForTimeout(time);
};

const moveMouseToElement = async (page, element, delay = 100) => {
  const box = await element.boundingBox();
  // const { x: startX, y: startY } = await page.mouse.getPosition();  // 获取当前鼠标位置
  const startX = 0;
  const startY = 0;
  const endX = box.x + box.width / 2;
  const endY = box.y + box.height / 2;
  const steps = 10;  // 增加步数使鼠标移动更慢

  // 使用贝塞尔曲线模拟更自然的鼠标移动路径
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * (startX + endX) / 2 + t * t * endX;
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * (startY + endY) / 2 + t * t * endY;

    await page.mouse.move(x, y);
    await page.waitForTimeout(50);  // 1秒
  }
};
// 这个函数用于检测“加载中”的指示是否存在
const isLoadingIndicatorVisible = async (page, loadingIndicatorXPath) => {
  const [loadingElement] = await page.$x(loadingIndicatorXPath);
  return !!loadingElement;
};


const checkCriteria = async (page, criteriaXPath) => {
  if (!criteriaXPath) return false;
  const [element] = await page.$x(criteriaXPath);
  return !!element;
};

const clickElementIfVisible = async (page, xpaths, options = {}) => {
  const {
    successCriteriaXPaths = [],
    failureCriteriaXPaths = [],
    intervalTime = 50,
    maxWaitTime = 1000,
    maxRetries = 3
  } = options;

  for (let i = 0; i < xpaths.length; i++) {
    const xpath = xpaths[i];
    const successCriteria = successCriteriaXPaths[i];
    const failureCriteria = failureCriteriaXPaths[i];

    let retries = 0;
    while (retries < maxRetries) {
      try {
        const [element] = await page.$x(xpath);
        if (!element) {
          break;
        }

        const box = await element.boundingBox();
        if (!box) {
          break;
        }

        await moveMouseToElement(page, element);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

        let elapsedTime = 0;
        while (elapsedTime < maxWaitTime) {
          if (successCriteria && await checkCriteria(page, successCriteria)) {
            await randomSleep(page);
            return;
          } else if (failureCriteria && await checkCriteria(page, failureCriteria)) {
            retries = 0; // 失败条件满足，重试计数器清零
            break;
          }
          await page.waitForTimeout(intervalTime);
          elapsedTime += intervalTime;
        }

        if (!successCriteria && !failureCriteria) {
          await randomSleep(page);
          return;
        }

        retries++;

      } catch (error) {
        logger.error(`使用XPath ${xpath} 点击元素后操作未确认，错误：${error.message}`);
        retries++;
      }
    }
  }

  throw new Error(`尝试所有XPath都失败了，XPaths: ${xpaths.join(', ')}`);
};



const typeInputIfVisible = async (page, xpaths, inputText, options = {}) => {
  const {
    successCriteriaXPaths = [],
    failureCriteriaXPaths = [],
    intervalTime = 500,
    maxWaitTime = 5000
  } = options;

  for (let i = 0; i < xpaths.length; i++) {
    const xpath = xpaths[i];
    const successCriteria = successCriteriaXPaths[i];
    const failureCriteria = failureCriteriaXPaths[i];

    try {
      const [inputElement] = await page.$x(xpath);
      if (!inputElement) {
        continue; // 如果此XPath元素未找到，尝试下一个XPath
      }

      const box = await inputElement.boundingBox();
      if (!box) {
        continue; // 如果此XPath元素不可见，尝试下一个XPath
      }

      await moveMouseToElement(page, inputElement);
      await inputElement.type(inputText);

      let isTypeSuccessful = true;  // 假设输入是成功的，除非后面的验证显示否则

      let elapsedTime = 0;
      while (elapsedTime < maxWaitTime) {
        if (successCriteria && await checkCriteria(page, successCriteria)) {
          await randomSleep(page);
          return; // 输入成功，直接返回
        } else if (failureCriteria && await checkCriteria(page, failureCriteria)) {
          isTypeSuccessful = false;
          break; // 输入失败，退出当前尝试
        }
        await page.waitForTimeout(intervalTime);
        elapsedTime += intervalTime;
      }

      if (isTypeSuccessful) return;  // 如果输入成功，则直接返回，不再尝试其他XPath
    } catch (error) {
      logger.info(`使用XPath ${xpath} 输入文本后操作未确认，错误：${error.message}`);
    }
  }

  throw new Error(`尝试所有XPath都失败了，XPaths: ${xpaths.join(', ')}`);
};

const loginTikTok = async (page, username, password, auxiliaryEmail) => {
  try {
    await page.goto('https://www.tiktok.com/explore');

    await randomSleep(page);
    // ------------------ 点击登录  ------------------
    try {
      logger.info(`执行任务：点击登录按钮`);
      await clickElementIfVisible(page,
        ['//*[@id="header-login-button"]'],
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await page.waitForTimeout(100000);  // 重试前休眠
      await page.close();
    }
    // ------------------ 选择登录类型  ------------------
    try {
      logger.info(`执行任务：选择登录类型`);
      await clickElementIfVisible(page,
        ['//*[@id="loginContainer"]/div/div/a[2]/div/p','//*[@id="tux-3-tab-email/username"]/span'],
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await page.waitForTimeout(100000);  // 重试前休眠
      await page.close();
    }

    // ------------------ 选择账号登录/密码  ------------------
    try {
      logger.info(`执行任务：选择账号登录/密码`);
      await clickElementIfVisible(page,
        ['//*[@id="loginContainer"]/div[2]/form/div[1]/a'],
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await page.waitForTimeout(100000);  // 重试前休眠
      await page.close();
    }

    // ------------------ 输入账号密码  ------------------
    try {
      logger.info(`执行任务：输入账号`);
      await typeInputIfVisible(page,
        ['//*[@id="loginContainer"]/div[2]/form/div[1]/input','//*[@id="tux-3-panel-email/username"]/div/form/div[1]/input'],
        username,
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await page.waitForTimeout(100000);  // 重试前休眠
      await page.close();
    }
    try {
      logger.info(`执行任务：输入密码`);
      await typeInputIfVisible(page,
        ['//*[@id="loginContainer"]/div[2]/form/div[2]/div/input','//*[@id="tux-3-panel-email/username"]/div/form/div[2]/div/input'],
        password,
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await page.waitForTimeout(100000);  // 重试前休眠
      await page.close();
    }

    // ------------------ 点击登录  ------------------
    try {
      logger.info(`执行任务：点击登录`);
      await clickElementIfVisible(page,
        ['//*[@id="loginContainer"]/div[2]/form/button','//*[@id="tux-3-panel-email/username"]/div/form/button'],
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: ['//*[@id="loginContainer"]/div[2]/form/div[3]/span']
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await page.waitForTimeout(100000);  // 重试前休眠
      await page.close();
    }


    // logger.info('点击下一步:个人签名');
    // await page.goto("https://www.tiktok.com/@"+username)

    await page.waitForTimeout(300000);
  } catch (e) {
    logger.error(e);
  }
};

async function getImageAsBase64(url) {
  try {
    const response = await axios.get(url, {responseType: 'arraybuffer'});
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return base64;
  } catch (error) {
    logger.error('Error fetching the image:', error.message);
    return null;
  }
}

// Main Execution
const run = async (username, password, auxiliaryEmail) => {
  const browser = await puppeteerExtra.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      '--no-default-browser-check',
      '--disable-infobars',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ]
  });

  const page = await browser.newPage();


  // 启用请求拦截
  await page.setRequestInterception(true);

  // 请求拦截监听器
  page.on('request', (request) => {
    // 如果请求的是视频、图片或字体，就终止该请求
    if (['js', 'font'].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });


  await page.emulate({
    viewport: VIEWPORT,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  });

  page.on('response', response => responseHandler(response, page));

  // page.on('console', msg => logger.debug(`Page Log: ${msg.text()}`));
  await page.setDefaultTimeout(60000);
  await loginTikTok(page, username, password, auxiliaryEmail);

  await browser.close();

};

export const callApiAndRun = async () => {
  const headers = {
    'token': 'd51w0T6K2M8M4K0W6X2T',
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.get('http://111.230.34.130:9080/v1/tasks?page=1&pageSize=10', {headers: headers});

    if (response.data && response.data.code === 200 && Array.isArray(response.data.data.list)) {
      const dataList = response.data.data.list;
      const promises = []; // 存储所有的run异步任务

      for (const item of dataList) {
        if (typeof item.taskData === 'string') {
          const parsedTaskData = JSON.parse(item.taskData);

          if (parsedTaskData && Array.isArray(parsedTaskData.accounts)) {
            for (const user of parsedTaskData.accounts) {
              const {account, password, auxiliaryEmail} = user;
              // 将每个异步任务都添加到promises数组中
              promises.push(run(account, password, auxiliaryEmail));
            }
          }
        }
      }
      // 使用Promise.all同时运行所有的异步任务
      await Promise.all(promises);
    } else {
      logger.info('API返回的数据不包含有效的list，不执行 run 函数');
    }
  } catch (error) {
    logger.error('在callApiAndRun中发生错误:', error.message);
  }
}

callApiAndRun().catch(err => logger.error('在调用API和执行run函数期间发生错误', err));
