// 获取命令行参数
const { logger } = require("./logger.js");
const { callApiAndRun } = require('./server.js')

const args = process.argv.slice(2); // 获取从第三个参数开始的所有参数
const method = args[0]; // 获取命令名称（callApiAndRun）
const tokenArg = args.find(arg => arg.startsWith('--token='))

const argsParams =  {
  token: ''
}
if (tokenArg) {
  argsParams.token = tokenArg.split('=')[1]; // 通过分割字符串获取 token 的值
  console.log(`Token value: ${argsParams.token}`);
} else {
  console.error('Token parameter is missing.');
}
// 根据命令行参数的不同值调用不同的方法
if (method === 'callApiAndRun') {
  callApiAndRun(argsParams.token).then().catch(err => logger.error('在调用API和执行run函数期间发生错误', err));
} else {
  console.log('Invalid method. Please specify "callApiAndRun" as the argument.');
}
