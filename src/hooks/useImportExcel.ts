import * as XLSX from "xlsx";
import { writeBinaryFile } from '@tauri-apps/api/fs';
import { downloadDir } from '@tauri-apps/api/path';

/**
 * 导入并解析表格
 */
export const useImportExcel = () => {
  return new Promise((resolve, reject) => {
    // 解析Excel
    function changeFile(e) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = () => {
        const arrayBuffer = reader.result;
        const options = { type: "array" };
        const workbook = XLSX.read(arrayBuffer, options);
        const reslut = [];
        workbook.SheetNames.forEach(item => {
          const tv = XLSX.utils.sheet_to_json(workbook.Sheets[item]);
          reslut.push({
            name: item,
            tableValue: tv
          });
        });
        resolve(reslut);
      };
      document.body.removeChild(input);
    }
    const input = document.createElement("input");
    input.type = "file";
    input.style.position = "fixed";
    input.style.top = "-100vh";
    input.style.left = "-100vw";
    input.onchange = e => changeFile(e);
    // input.accept = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    document.body.append(input);
    input.click();
  });
};
/**
 * 导出 excel 文件
 * @param array JSON 数组
 * @param sheetName 第一张表名
 * @param fileName 文件名
 */
 export async function exportExcelFile(
  array: any[],
  sheetName = "sheet1",
) {
  const jsonWorkSheet = XLSX.utils.json_to_sheet(array);
  const workBook = {
    SheetNames: [sheetName],
    Sheets: {
      [sheetName]: jsonWorkSheet
    }
  };
  const buffer = XLSX.write(workBook, { bookType: 'xlsx', type: 'buffer' });
  const downloadDirPath = await downloadDir();
  const timestamp = new Date().getTime();
  return writeBinaryFile(`${downloadDirPath}/示例_${timestamp}.xlsx`, buffer, {append: false });
}
