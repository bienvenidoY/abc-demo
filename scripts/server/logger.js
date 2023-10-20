const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, err) => {
    console.error(`[ERROR] ${message}`);
    if (err) console.error(err.stack || err);
  },
  debug: (message) => console.log(`[DEBUG] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`)  // 添加的warn方法
};

module.exports = {
  logger,
}
