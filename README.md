# Obsidian 思维导图插件

这是一个支持在线编辑的思维导图插件，可以在 Obsidian 内部或浏览器中打开。基于 [WindLunas](https://www.windlunas.cn) 的思维导图服务实现。

思维导图工具：https://wanglin2.github.io/mind-map-docs/
可使用docker部署

## 功能特点

- 🔄 支持在线编辑和实时保存
- 📝 支持从 Markdown 文件创建思维导图
- 🎨 自动适配 Obsidian 主题
- 🖼️ 支持导出为图片
- 📱 支持移动端
- 🌐 支持浏览器打开
- 🎯 支持多种打开方式
- 🔧 高度可配置

## 使用方法

1. 从左侧边栏点击思维导图图标，打开思维导图
2. 右键点击任何 Markdown 文件，选择"在思维导图中打开"
3. 在思维导图中直接编辑内容

## 配置选项

1. 基本设置：
   - 在浏览器中打开：选择是在浏览器中打开还是在 Obsidian 中打开
   - 服务器地址：可以自定义思维导图服务器的地址
   - 主题：可以选择自动（跟随 Obsidian）、亮色或暗色
   - 自动同步主题：是否自动同步 Obsidian 的主题变化
   - 默认语言：可以选择简体中文或英文

2. 浏览器窗口设置（仅在选择在浏览器中打开时有效）：
   - 窗口宽度：设置浏览器窗口的默认宽度
   - 窗口高度：设置浏览器窗口的默认高度

## 安装方法

1. 下载发布包
2. 解压到 Obsidian 插件目录：
   - Windows: `%APPDATA%\Obsidian\plugins\`
   - macOS: `~/Library/Application Support/obsidian/plugins/`
   - Linux: `~/.config/obsidian/plugins/`
3. 在 Obsidian 中启用插件

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 工作日志

### 2024-03-05
- 创建项目基础结构
- 实现思维导图核心功能
- 添加主题自适应支持
- 添加浏览器打开支持
- 添加配置选项
- 优化用户界面

## 致谢

- [Obsidian](https://obsidian.md/) - 知识管理工具
- [WindLunas](https://www.windlunas.cn) - 思维导图服务提供者

## 许可证

[MIT](LICENSE) © WindLunas
