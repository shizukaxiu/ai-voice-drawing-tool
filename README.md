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
| 后端 | Node.js + Express + TypeScript |
| 语音转文字 | 讯飞短语音识别 API |
| 意图理解 / Prompt 扩写 | DeepSeek-V3 |
| 首次图像生成 | 通义万相文生图 API |
| 图像编辑 | 通义万相图像编辑 API（`wanx2.1-imageedit`） |
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
│   │   │   ├── store/        # 状态管理
│   │   │   └── types/        # 本地类型
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── server/               # Express 后端
│       ├── src/
│       │   ├── routes/       # API 路由
│       │   ├── services/     # ASR / LLM / 图像生成服务
│       │   ├── types/        # 本地类型
│       │   ├── utils/        # 工具函数
│       │   └── prompts/      # Stage 1 / Stage 2 Prompt
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

使用 npm workspaces 一次性安装所有依赖：

```bash
npm install
```

### 3. 配置环境变量

进入后端目录，复制环境变量示例文件：

```bash
cd apps/server
cp .env.example .env
```

然后编辑 `.env`，填入你的 API Keys：

```env
PORT=8080

# 讯飞 ASR
IFLYTEK_APP_ID=your_app_id
IFLYTEK_API_KEY=your_api_key
IFLYTEK_API_SECRET=your_api_secret

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key

# 阿里云通义万相
DASHSCOPE_API_KEY=your_dashscope_api_key
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
- AI 信息不足时会以文字气泡追问
- 生成图片后，可以：
  - **语音继续修改**：基于原图进行编辑
  - **点击【整张重画】**：重新文生图
  - **点击【开启新对话】**：清空上下文重新开始

---

## 开发状态

当前已完成：
- [x] 项目目录结构搭建
- [x] React + Vite + TypeScript + TailwindCSS 前端初始化
- [x] Express + TypeScript 后端初始化
- [x] 前后端共享类型配置
- [x] 并发开发脚本配置

进行中 / 待实现：
- [ ] 前端录音与音频上传
- [ ] 讯飞 ASR 接入
- [ ] DeepSeek Stage 1 / Stage 2 接入
- [ ] 通义万相生图 / 编辑接入
- [ ] 微信对话式 UI 实现
- [ ] 多轮修改与上下文管理

---

## 许可证

MIT
