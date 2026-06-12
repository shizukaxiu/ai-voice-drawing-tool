# AI 语音绘图工具

一款纯语音控制的 AI 绘图工具。用户通过自然语言描述画面，系统完成语音识别、意图理解、Prompt 优化和图像生成，并以微信对话式的交互展示结果。

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
│   │   │   ├── services/     # API 调用
│   │   │   └── store/        # 状态管理
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
讯飞 ASR 转文字
    ↓
DeepSeek-V3 提取结构化参数 / 追问补充
    ↓
DeepSeek-V3 扩写为通义万相 Prompt
    ↓
通义万相生图 / 基于原图编辑
    ↓
微信对话式界面展示结果
```

---

## 交互说明

- 按住底部【按住说话】按钮描述想要的画面
- AI 信息不足时会以文字气泡追问，点击建议卡片可直接使用该描述
- 生成图片后，可以：
  - **语音继续修改**：基于原图进行局部编辑
  - **点击【整张重画】**：放弃原图，按新描述重新文生图
  - **点击【开启新对话】**：清空上下文重新开始
  - **点击【放大查看】**：Lightbox 预览并下载图片
- 左侧配置面板可填写 API Key，配置保存在浏览器本地；留空则使用服务端 `.env` 默认值

---

## 已实现功能

- [x] 项目目录结构搭建
- [x] React + Vite + TypeScript + TailwindCSS 前端
- [x] Express + TypeScript 后端
- [x] 前后端共享类型配置
- [x] 并发开发脚本配置
- [x] 前端录音与音频上传
- [x] 后端接入讯飞 ASR（含音频转码、WebSocket 签名、结果拼接）
- [x] DeepSeek Stage 1 / Stage 2 接入
- [x] 通义万相生图 / 编辑接入
- [x] 微信对话式 UI
- [x] 多轮修改与上下文管理
- [x] 图片 Lightbox 预览与下载
- [x] 建议选项一键点击提交
- [x] 左侧 API Key 配置面板（localStorage 持久化）
- [x] 图生图编辑 Prompt 优化（确定性编辑指令 + negative_prompt）

---

## 许可证

MIT
