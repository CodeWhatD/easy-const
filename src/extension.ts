import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  console.log("File Intellisense 插件已激活");

  // 获取配置
  const config = vscode.workspace.getConfiguration("fileIntellisense");
  const targetFolderRelative = config.get<string>("targetFolder", "./src");
  const fileExtensions = config.get<string[]>("fileExtensions", [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".json",
    ".txt",
  ]);
  const functionName = config.get<string>("functionName", "useConst");

  console.log("fileExtensions", fileExtensions);
  console.log("functionName", functionName);
  console.log("targetFolderRelative", targetFolderRelative);

  let targetFolder: string | undefined;
  if (vscode.workspace.workspaceFolders) {
    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    targetFolder = path.join(workspaceRoot, targetFolderRelative);
  } else {
    vscode.window.showWarningMessage("请先打开一个工作区或文件夹。");
    return;
  }

  // 注册完成项提供器
  const provider = vscode.languages.registerCompletionItemProvider(
    ["javascript", "typescript", "javascriptreact", "typescriptreact"],
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character);

        // 匹配 useConst(" 模式
        const triggerPattern = new RegExp(`${functionName}\\(\\"([^\\"]*)$`);
        const match = linePrefix.match(triggerPattern);
        console.log("match", match);
        console.log("linePrefix", linePrefix);
        if (!match) {
          return undefined;
        }

        const currentInput = match[1] || ""; // 获取已经输入的部分
        const completionItems: vscode.CompletionItem[] = [];

        try {
          // 读取目标文件夹下的文件
          const files = fs.readdirSync(targetFolder!);

          for (const file of files) {
            const filePath = path.join(targetFolder!, file);
            const stat = fs.statSync(filePath);

            // 只处理文件，忽略文件夹
            if (!stat.isFile()) {
              continue;
            }

            // 检查文件扩展名是否符合配置
            const ext = path.extname(file);
            if (fileExtensions.length === 0 || fileExtensions.includes(ext)) {
              // 如果用户已经输入了部分内容，只显示匹配的文件
              if (
                currentInput &&
                !file.toLowerCase().includes(currentInput.toLowerCase())
              ) {
                continue;
              }

              const completionItem = new vscode.CompletionItem(
                file,
                vscode.CompletionItemKind.File
              );

              // 设置插入文本，只插入文件名（不带引号）
              completionItem.insertText = file.replace(/"/g, '\\"');

              // 读取文件内容
              const filePath = path.join(targetFolder, file);
              console.log("文件路径filePath", filePath);
              console.log("文件路径filePath", fs.readFileSync(filePath, 'utf-8'));

              // 添加详细信息
              completionItem.detail = `文件: ${file}`;
              completionItem.documentation = `完整路径: ${filePath}`;

              // 设置筛选范围，使输入的部分内容能够筛选结果
              completionItem.filterText = `${functionName}("${file}`;
              completionItem.sortText = file;

              // 设置范围，确保替换正确的位置
              const startPosition = new vscode.Position(
                position.line,
                position.character - currentInput.length
              );
              completionItem.range = new vscode.Range(startPosition, position);

              completionItems.push(completionItem);
            }
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            `读取文件夹 ${targetFolder} 时出错: ${error}`
          );
        }

        return completionItems;
      },
    },
    '"' // 触发字符改为双引号
  );

  context.subscriptions.push(provider);

  // 可选：注册重新加载文件的命令
  const reloadDisposable = vscode.commands.registerCommand(
    "fileIntellisense.reload",
    () => {
      vscode.window.showInformationMessage("文件智能提示已重新加载");
    }
  );

  context.subscriptions.push(reloadDisposable);
}

export function deactivate() {}
