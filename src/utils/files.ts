const fs = require("fs");
const path = require("path");

export function getAllFiles(
  dirPath,
  arrayOfFiles: FileInfo[] = []
): FileInfo[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      // 如果是文件夹，递归读取
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      // 如果是文件，添加到数组
      arrayOfFiles.push({
        filename: file,
        path: fullPath,
      });
    }
  });

  return arrayOfFiles;
}
