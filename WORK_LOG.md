# 工作日志

> 记录项目开发过程中的每一步操作和完成状态。

---

## 2026-06-12

### 已完成

- [x] 完成 `design.md` 设计文档并推送到 GitHub
- [x] 创建 TODO 清单，规划代码框架搭建步骤
- [x] 创建 `WORK_LOG.md` 工作日志文件
- [x] 创建项目目录结构（apps/web、apps/server、packages/shared）
  - 创建了 `apps/web`、`apps/server`、`packages/shared` 三个目录
  - 添加 `.gitkeep` 文件以便 Git 跟踪空目录
  - 提交并推送到 GitHub：`b26b11f`
- [x] 初始化前端项目（React + Vite + TypeScript + TailwindCSS）
  - 使用 Vite 创建 React + TypeScript 项目于 `apps/web`
  - 安装并配置 TailwindCSS v4（`@tailwindcss/vite` 插件）
  - 创建 `components`、`hooks`、`services`、`types`、`store` 目录
  - 清理默认 `App.tsx` 为项目初始页面
  - 验证 `npm run build` 成功
  - 提交并推送到 GitHub：`757ba4b`
- [x] 初始化后端项目（Express + TypeScript）
  - 在 `apps/server` 中初始化 npm 项目
  - 安装 Express、CORS、dotenv 等依赖
  - 配置 TypeScript（`tsconfig.json`）
  - 创建 `routes`、`services`、`types`、`utils`、`prompts` 目录
  - 创建入口文件 `src/index.ts`，提供 `/health` 健康检查接口
  - 默认端口设为 `8080`（避免本地 3000 端口冲突）
  - 验证 `npm run build` 成功，健康检查接口返回正常
  - 提交并推送到 GitHub：`331db74`
- [x] 配置前后端共享类型（packages/shared）
  - 创建根目录 `package.json`，配置 npm workspaces
  - 创建 `@voice-draw/shared` 包，定义核心类型
  - 配置前后端通过 npm workspace 引用共享类型
  - 验证前后端 `npm run build` 均成功
  - 创建根目录 `.gitignore`，排除 `node_modules`、`dist` 等
  - 提交并推送到 GitHub：`f0dc469`
- [x] 配置开发启动脚本（同时启动前后端）
  - 安装 `concurrently`
  - 根目录 `package.json` 添加 `dev` 脚本，同时启动前后端
  - 添加 `build` 脚本，构建 shared、server、web
  - 验证 `npm run build` 成功
  - 验证 `npm run dev` 同时启动前后端（前端 5173，后端 8080）
  - 提交并推送到 GitHub：`840880f`
- [x] 编写 README 运行说明
  - 创建根目录 `README.md`
  - 包含项目简介、技术栈、目录结构、本地运行步骤、API Key 申请链接、核心流程、交互说明、开发状态
  - 提交并推送到 GitHub：`11f4ada`

### 待开始

- [ ] 验证前后端能正常启动（最终整体验证）
