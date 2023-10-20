const axios = require('axios');
const puppeteerExtra = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const  { moveMouseToElement, determineCaptchaType, CAPTCHA, handleCaptchaByType } = require('./verify-code.js')
const { logger }  = require('./logger.js')
puppeteerExtra.use(stealth());

function findChromePath() {
  const paths = {
    'darwin': [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ],
    'win32': [
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    ],
    'linux': [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser'
    ]
  };

  const platform = process.platform;
  if (paths[platform]) {
    for (let path of paths[platform]) {
      if (fs.existsSync(path)) {
        return path;
      }
    }
  }

  throw new Error('Chrome installation not found');
}

// Constants
const URLS = {
  captchaGet: 'https://us.tiktok.com/captcha/get',
  captchaOversea: 'https://p16-security-va.ibyteimg.com/img/security-captcha-oversea-usa'
};

const VIEWPORT = {
  width: 900,
  height: 812
};

let CAPTCHA_TYPE = CAPTCHA.TYPE_DEFAULT;

let token = ''

const responseHandler = async (response, page) => {
  const url = response.url();
  try {
    if (url.includes(URLS.captchaGet)) {
      const jsonData = await response.json();
      const question = jsonData.data.question;
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


const randomSleep = async (page, min = 50, max = 200) => {
  const time = Math.random() * (max - min) + min;
  await page.waitForTimeout(time);
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
        const elementType = await (await element.getProperty('nodeName')).jsonValue();
        if (!element) {
          break;
        }

        const box = await element.boundingBox();
        if (!box) {
          break;
        }

        await moveMouseToElement(page, element);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

        // 根据元素类型决定休眠时长
        if (elementType.toLowerCase() === 'button') {
          await page.waitForTimeout(Math.floor(Math.random() * 5000) + 5000); // 休眠5-10秒
        } else {
          await randomSleep(page);
        }


        // 点击之后 休眠
        await randomSleep(page);

        let elapsedTime = 0;
        while (elapsedTime < maxWaitTime) {
          if (successCriteria) {
            // 如果存在成功条件并且该条件已满足，直接返回
            if (await checkCriteria(page, successCriteria)) {
              await randomSleep(page);
              return;
            }
          }
          if (failureCriteria) {
            const failureConditionMet = await checkCriteria(page, failureCriteria);
            console.log("失败条件:", failureConditionMet, retries)
            // 如果失败条件当前满足
            if (failureConditionMet) {
              retries = 0;
              break; // 跳出等待循环并清零重试计数器
            }
            // 如果失败条件不满足并且重试次数已经超过 maxRetries（表示已经重试过），则认为操作成功，跳出循环
            else if (retries > maxRetries) {
              await randomSleep(page);
              return;
            } else if (!failureConditionMet) {
              await randomSleep(page);
              console.log("重试成功，跳出当前循环")
              return
            }
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

const loginTikTok = async (page, username, password, auxiliaryEmail, taskId, cardId) => {

  try {
    await page.goto('https://www.tiktok.com/explore');

    await randomSleep(page);
    // ------------------ 点击登录  ------------------
    try {
      logger.info(`执行任务：点击登录按钮`);
      await uploadLog(taskId, cardId, "INFO", "点击登录按钮")
      await clickElementIfVisible(page,
        ['//*[@id="header-login-button"]'],
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      await uploadLog(taskId, cardId, "ERROR", "点击登录按钮失败")
      logger.error(`任务失败：${e.message}`);
      await page.close();
    }
    // ------------------ 选择登录类型  ------------------
    try {
      logger.info(`执行任务：选择登录类型`);
      await uploadLog(taskId, cardId, "INFO", "选择登录类型")
      await clickElementIfVisible(page,
        ['//!*[@id="loginContainer"]/div/div/a[2]/div/p', '//!*[@id="tux-3-tab-email/username"]/span'],
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await uploadLog(taskId, cardId, "ERROR", "选择登录类型失败")
      await page.close();
    }

    // ------------------ 选择账号登录/密码  ------------------
    try {
      logger.info(`执行任务：选择账号登录/密码`);
      await uploadLog(taskId, cardId, "INFO", "选择账号登录/密码")
      await clickElementIfVisible(page,
        ['//!*[@id="loginContainer"]/div[2]/form/div[1]/a'],
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await uploadLog(taskId, cardId, "ERROR", "选择账号登录/密码失败")
      await page.close();
    }

    // ------------------ 输入账号密码  ------------------
    try {
      logger.info(`执行任务：输入账号`);
      await uploadLog(taskId, cardId, "INFO", "输入账号")
      await typeInputIfVisible(page,
        ['//!*[@id="loginContainer"]/div[2]/form/div[1]/input', '//!*[@id="tux-3-panel-email/username"]/div/form/div[1]/input'],
        username,
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await uploadLog(taskId, cardId, "ERROR", "输入账号失败")
      await page.close();
    }
    try {
      logger.info(`执行任务：输入密码`);
      await uploadLog(taskId, cardId, "INFO", "输入密码")
      await typeInputIfVisible(page,
        ['//!*[@id="loginContainer"]/div[2]/form/div[2]/div/input', '//!*[@id="tux-3-panel-email/username"]/div/form/div[2]/div/input'],
        password,
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: []
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await uploadLog(taskId, cardId, "ERROR", "输入密码失败")
      await page.close();
    }

    // ------------------ 点击登录  ------------------
    try {
      logger.info(`执行任务：点击登录`);
      await uploadLog(taskId, cardId, "INFO", "点击登录")
      await clickElementIfVisible(page,
        ['//!*[@id="loginContainer"]/div[2]/form/button', '//!*[@id="tux-3-panel-email/username"]/div/form/button'],
        {
          successCriteriaXPaths: [],
          failureCriteriaXPaths: ['//!*[@id="loginContainer"]/div[2]/form/div[3]/span']
        }
      );

    } catch (e) {
      logger.error(`任务失败：${e.message}`);
      await uploadLog(taskId, cardId, "ERROR", "点击登录失败")
      await page.close();
    }

    // logger.info('点击下一步:个人签名');
    // await uploadLog(taskId, cardId, "INFO", "个人签名")
    // await page.goto("https://www.tiktok.com/@" + username)

    await page.waitForTimeout(300000);
  } catch (e) {
    logger.error(e);
  }
};

async function uploadLog(taskId, cardId, logLevel, message) {
  const endpoint = 'http://111.230.34.130:9080/v1/log';
  const headers = {
    'Content-Type': 'application/json',
    'token': token,
  };
  const body = {
    taskId,
    cardId,
    logLevel,
    message
  };


  try {
    const response = await axios.post(endpoint, body, {headers});
    console.log(response.data)
    return response.data;  // 假设服务器返回JSON格式的响应
  } catch (error) {
    console.error('Error uploading log:', error);
    throw error;  // 或者你可以选择返回错误信息
  }
}

let browser = null
const callApiAndRun = async (tokenParams) => {
  // uploadLog 使用 token
  token = tokenParams
  const headers = {
    token: token,
    'Content-Type': 'application/json',
    client: new Date().getTime()
  };

  try {
    const response = await axios.get('http://111.230.34.130:9080/v1/tasks?page=1&pageSize=10', {headers: headers});
    if (response.data && response.data.code === 200 && Array.isArray(response.data.data.list)) {
      if(!browser) {
        browser = await puppeteerExtra.launch({
          headless: false,
          // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          executablePath: findChromePath(),
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
      }

      const dataList = response.data.data.list;
      const promises = []; // 存储所有的run异步任务

      for (const item of dataList) {
        if (typeof item.taskData === 'string') {
          const parsedTaskData = JSON.parse(item.taskData);
          const taskId = item.taskId
          const cardId = item.functionalCardId
          const logLevel = "INFO"
          const message = "执行任务"
          await uploadLog(taskId, cardId, logLevel, message)

          if (parsedTaskData && Array.isArray(parsedTaskData.accounts)) {
            for (const user of parsedTaskData.accounts) {
              const {account, password, auxiliaryEmail} = user;
              // 将每个异步任务都添加到promises数组中
              promises.push(run(account, password, auxiliaryEmail, taskId, cardId));
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

// Main Execution
const run = async (username, password, auxiliaryEmail, taskId, cardId) => {
  if(!browser) {
    logger.error('浏览器未初始化')
    return
  }
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

  await page.setDefaultTimeout(60000);
  await loginTikTok(page, username, password, auxiliaryEmail, taskId, cardId);

  await browser.close();
};

module.exports = {
  callApiAndRun,
}
