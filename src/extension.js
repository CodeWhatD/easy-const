"use strict";
exports.__esModule = true;
exports.deactivate = exports.activate = void 0;
var vscode = require("vscode");
var path = require("path");
var fs = require("fs");
var jsyaml = require("js-yaml");
function activate(context) {
    console.log("File Intellisense 插件已激活");
    // 获取配置
    var config = vscode.workspace.getConfiguration("fileIntellisense");
    var targetFolderRelative = config.get("targetFolder", "./src");
    var fileExtensions = config.get("fileExtensions", [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".json",
        ".txt",
    ]);
    var functionName = config.get("functionName", "useConst");
    console.log("fileExtensions", fileExtensions);
    console.log("functionName", functionName);
    console.log("targetFolderRelative", targetFolderRelative);
    var targetFolder;
    if (vscode.workspace.workspaceFolders) {
        var workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        targetFolder = path.join(workspaceRoot, targetFolderRelative);
    }
    else {
        vscode.window.showWarningMessage("请先打开一个工作区或文件夹。");
        return;
    }
    // 注册完成项提供器
    var provider = vscode.languages.registerCompletionItemProvider(["javascript", "typescript", "javascriptreact", "typescriptreact"], {
        provideCompletionItems: function (document, position) {
            var linePrefix = document
                .lineAt(position)
                .text.substring(0, position.character);
            // 匹配 useConst(" 模式
            var triggerPattern = new RegExp("".concat(functionName, "\\(\\\"([^\\\"]*)$"));
            var match = linePrefix.match(triggerPattern);
            console.log("match", match);
            console.log("linePrefix", linePrefix);
            if (!match) {
                return undefined;
            }
            var currentInput = match[1] || ""; // 获取已经输入的部分
            var completionItems = [];
            try {
                // 读取目标文件夹下的文件
                var files = fs.readdirSync(targetFolder);
                for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                    var file = files_1[_i];
                    var filePath = path.join(targetFolder, file);
                    var stat = fs.statSync(filePath);
                    // 只处理文件，忽略文件夹
                    if (!stat.isFile()) {
                        continue;
                    }
                    // 检查文件扩展名是否符合配置
                    var ext = path.extname(file);
                    if (fileExtensions.length === 0 || fileExtensions.includes(ext)) {
                        // 如果用户已经输入了部分内容，只显示匹配的文件
                        if (currentInput &&
                            !file.toLowerCase().includes(currentInput.toLowerCase())) {
                            continue;
                        }
                        var completionItem = new vscode.CompletionItem(file, vscode.CompletionItemKind.File);
                        // 设置插入文本，只插入文件名（不带引号）
                        completionItem.insertText = file.replace(/"/g, '\\"');
                        // 读取文件内容
                        var filePath_1 = path.join(targetFolder, file);
                        console.log("文件路径filePath", filePath_1);
                        // 解析常量yaml文件
                        var yamlContent = jsyaml.load(fs.readFileSync(filePath_1, "utf-8"));
                        // 添加详细信息
                        completionItem.detail = "\u6587\u4EF6: ".concat(file);
                        completionItem.documentation = "\u5B8C\u6574\u8DEF\u5F84: ".concat(filePath_1);
                        // 设置筛选范围，使输入的部分内容能够筛选结果
                        completionItem.filterText = "".concat(functionName, "(\"").concat(file);
                        completionItem.sortText = file;
                        // 设置范围，确保替换正确的位置
                        var startPosition = new vscode.Position(position.line, position.character - currentInput.length);
                        completionItem.range = new vscode.Range(startPosition, position);
                        completionItems.push(completionItem);
                    }
                }
            }
            catch (error) {
                vscode.window.showErrorMessage("\u8BFB\u53D6\u6587\u4EF6\u5939 ".concat(targetFolder, " \u65F6\u51FA\u9519: ").concat(error));
            }
            return completionItems;
        }
    }, '"' // 触发字符改为双引号
    );
    context.subscriptions.push(provider);
    // 可选：注册重新加载文件的命令
    var reloadDisposable = vscode.commands.registerCommand("fileIntellisense.reload", function () {
        vscode.window.showInformationMessage("文件智能提示已重新加载");
    });
    context.subscriptions.push(reloadDisposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
