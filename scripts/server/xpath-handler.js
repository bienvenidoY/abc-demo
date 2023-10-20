const { logger }  = require('./logger.js')

/**
 * 查找元素
 */
const handleSearchDom = async (xpath,page)=>{
  try{
    async function search(i=0){
      if(!xpath[i]){
        logger.info('---------未找到匹配XPath表达式的元素');
        return null
      }
      const elements = await page.$x(xpath[i]);
      if (elements.length > 0) {
        // 找到了匹配XPath表达式的元素
        const element = elements[0];
        // 在这里可以对找到的元素进行操作
        return  element
      } else {
        return search(i++)
      }
    }
    return search()
  }catch (e) {
    logger.info('---------查找元素失败：' + e)
  }
}

/**
 * 处理元素的点击事件
 */
const handleClick = async (job,page)=>{
  try{
    if(job.xpath.length>0){
      const element = await handleSearchDom(job.xpath,page)
      element.click();
      await page.waitForTimeout(3000);
    }
  }catch (e) {
    logger.info(`---------步骤-${job.title}-执行失败：${e}`)
  }
}
/**
 * 处理元素的输入事件
 */
const handleInput = async (job,page)=>{
  try{
    if(job.xpath.length>0){
      const element = await handleSearchDom(job.xpath,page)
      await element.type(job.inputValue);
      await page.waitForTimeout(2000);
    }
  }catch (e) {
    logger.info(`---------步骤${job.title}执行失败：${e}`)
  }
}
