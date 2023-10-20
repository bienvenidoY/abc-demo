const { logger }  = require('./logger.js')
const axios = require('axios');
const {Random} = require('random-js');

const random = new Random();
const IMG_CACHE = {
  url1: null,
  url2: null
};

const CAPTCHA = {
  TYPE_DEFAULT: 0,
  TYPE_ROTATE: 2,
  TYPE_CLICK: 1
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

// 获取验证码图片
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
  return CAPTCHA.TYPE_DEFAULT;
}

// 选择验证方式
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

module.exports = {
  handleCaptchaByType,
  determineCaptchaType,
  moveMouseToElement,
  CAPTCHA,
}
