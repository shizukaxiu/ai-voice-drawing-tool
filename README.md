# AI 语音绘图工具

一款**纯语音控制**的 AI 绘图工具。用户通过自然语言描述画面，系统完成语音识别、意图理解、Prompt 优化和图像生成，并以微信对话式的交互展示结果。

> 项目路径：`C:\Users\a1246\Desktop\qiniuyun`  
> 设计文档：[design.md](./design.md)  
> 工作日志：[WORK_LOG.md](./WORK_LOG.md)

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + TailwindCSS v4 |
| 状态管理 | Zustand + localStorage 持久化 |
| 后端 | Node.js + Express + TypeScript |
| 语音转文字 | 讯飞短语音识别 API |
| 意图理解 / Prompt 扩写 | DeepSeek-V3 |
| 首次图像生成 | 通义万相文生图 API（`wanx2.1-t2i-turbo`） |
| 图像编辑 | 通义万相图像编辑 API（`wanx2.1-imageedit` / `description_edit`） |
| 类型共享 | npm workspaces + `@voice-draw/shared` |

---

## 目录结构

```
.
├── apps/
│   ├── web/                  # React 前端
│   │   ├── src/
│   │   │   ├── components/   # UI 组件
│   │   │   ├── hooks/        # 自定义 Hooks
│   │   │   ├── services/     # API 调用、本地意图识别、命令执行
│   │   │   ├── store/        # 状态管理
│   │   │   └── utils/        # 工具函数
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── server/               # Express 后端
│       ├── src/
│       │   ├── controllers/  # 生成/编辑 pipeline
│       │   ├── middleware/   # API 配置中间件
│       │   ├── routes/       # API 路由
│       │   ├── services/     # ASR / LLM / 图像生成服务
│       │   ├── prompts/      # Stage 1 / Stage 2 Prompt
│       │   └── middleware/   # 请求级配置上下文
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/               # 前后端共享类型
├── design.md                 # 设计文档
├── WORK_LOG.md               # 工作日志
├── package.json              # 根目录 workspace 配置
└── README.md                 # 本文件
```

---

## 本地运行

### 1. 克隆仓库

```bash
git clone git@github.com:shizukaxiu/ai-voice-drawing-tool.git
cd ai-voice-drawing-tool
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

进入后端目录，复制环境变量示例文件：

```bash
cd apps/server
cp .env.example .env
```

编辑 `.env`，填入你的 API Keys：

```env
PORT=8080

# 讯飞 ASR
IFLYTEK_APP_ID=your_app_id
IFLYTEK_API_KEY=your_api_key
IFLYTEK_API_SECRET=your_api_secret

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat

# 阿里云通义万相
DASHSCOPE_API_KEY=your_dashscope_api_key
DASHSCOPE_IMAGE_MODEL=wanx2.1-t2i-turbo

# 可选：硅基流动
IMAGE_PROVIDER=dashscope
SILICONFLOW_API_KEY=your_siliconflow_api_key
SILICONFLOW_IMAGE_MODEL=Qwen/Qwen-Image-Edit-2509
```

API Key 申请地址：
- 讯飞开放平台：https://www.xfyun.cn
- DeepSeek：https://platform.deepseek.com
- 阿里云百炼：https://bailian.console.aliyun.com

### 4. 启动开发服务器

在根目录运行：

```bash
npm run dev
```

将同时启动：
- 前端：`http://localhost:5173`
- 后端：`http://localhost:8080`

### 5. 构建项目

```bash
npm run build
```

构建顺序：`shared` → `server` → `web`

---

## 核心流程

```
用户语音描述
    ↓
前端 VAD 检测到 3 秒静音后自动截取音频
    ↓
讯飞 ASR 转文字（POST /api/transcribe）
    ↓
前端本地意图识别（停止/重画/保存/新对话等命令）
    ↓
非命令文本 → DeepSeek-V3 提取结构化参数 / 追问补充
    ↓
DeepSeek-V3 扩写为通义万相 Prompt
    ↓
通义万相生图 / 基于原图编辑
    ↓
微信对话式界面展示结果，并自动恢复聆听
```

---

## 交互说明

### 开始对话

点击底部蓝色【点击开始语音】按钮，允许浏览器使用麦克风。之后系统进入**持续聆听**状态：

- 说话时会显示“正在听你说话…”
- 停顿 3 秒后自动提交音频
- AI 回复完成后自动恢复聆听，无需再次点击按钮

### 语音命令

以下命令由前端本地识别并即时执行，无需等待 LLM：

| 命令 | 可识别的说法示例 | 效果 |
|------|-----------------|------|
| 停止聆听 | “停止”、“暂停”、“别说了”、“可以了”、“够了” | 关闭麦克风，回到待机状态 |
| 整体重画 | “重画”、“重新画”、“再来一张”、“画得不好” | 进入重画模式，下一段描述将重新文生图 |
| 新对话 | “新对话”、“重新开始”、“清空”、“从头来” | 清空当前会话并继续聆听 |
| 保存图片 | “保存”、“下载”、“存下来”、“我要这张图” | 下载当前生成的图片到本地 |
| 继续修改 | “修改”、“改一下”、“调整一下”、“换个风格” | 进入修改模式，下一段描述将基于原图编辑 |

### 日常创作 / 修改

- 直接描述想要的画面即可生成图片
- 生成图片后，继续语音描述修改要求即可基于原图编辑
- 点击图片可放大查看并手动下载

### 配置面板

左侧配置面板可填写 API Key，配置保存在浏览器本地；留空则使用服务端 `.env` 默认值。

---

## 已实现功能

- [x] 项目目录结构搭建
- [x] React + Vite + TypeScript + TailwindCSS 前端
- [x] Express + TypeScript 后端
- [x] 前后端共享类型配置
- [x] 并发开发脚本配置
- [x] 前端基于 MediaRecorder + Web Audio API 的连续录音与 VAD 静音检测
- [x] 后端接入讯飞 ASR（含音频转码、WebSocket 签名、结果拼接）
- [x] DeepSeek Stage 1 / Stage 2 接入
- [x] 通义万相生图 / 编辑接入
- [x] 微信对话式 UI
- [x] 多轮修改与上下文管理
- [x] 图片 Lightbox 预览与下载
- [x] 左侧 API Key 配置面板（localStorage 持久化）
- [x] 图生图编辑 Prompt 优化（确定性编辑指令 + negative_prompt）
- [x] 前端本地语音意图识别与命令执行
- [x] 后端 `/api/transcribe` 仅 ASR 接口，支持命令快速识别
- [x] 3 秒静音自动提交、AI 回复后自动恢复聆听
- [x] 麦克风权限错误提示

---

## 许可证

MIT
