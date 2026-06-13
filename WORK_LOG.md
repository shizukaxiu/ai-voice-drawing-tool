# 工作日志

> 记录项目开发过程中的每一步操作和完成状态。

---

## 2026-06-12

### 已完成

- [x] 完成 `design.md` 设计文档并推送到 GitHub
- [x] 创建 TODO 清单，规划代码框架搭建步骤
- [x] 创建 `WORK_LOG.md` 工作日志文件
- [x] 创建项目目录结构（apps/web、apps/server、packages/shared）
- [x] 初始化前端项目（React + Vite + TypeScript + TailwindCSS）
- [x] 初始化后端项目（Express + TypeScript）
- [x] 配置前后端共享类型（packages/shared）
- [x] 配置开发启动脚本（同时启动前后端）
- [x] 编写 README 运行说明
- [x] 验证前后端能正常启动（最终整体验证）

### 进行中

- [x] 前端录音与音频上传

---

## 2026-06-12 第二阶段：前端录音与音频上传

### 已完成

- [x] 创建 `useRecorder` Hook（基于 MediaRecorder API）
  - 支持开始/停止录音
  - 处理麦克风权限错误
  - 返回 `Blob` 格式音频
- [x] 创建 `RecorderButton` 组件
  - 按住说话 / 松开发送
  - 支持鼠标和触摸操作
  - 录音中视觉反馈
- [x] 创建前端 API service
  - `uploadAudio` 函数通过 FormData 上传音频
  - 使用 `@voice-draw/shared` 中的类型
- [x] 后端创建 `/api/generate` 接口
  - 使用 `multer` 接收音频文件
  - 保存到 `apps/server/uploads/`
  - 返回 `GenerateResponse` 结构
- [x] 联调验证
  - 前后端同时启动成功
  - 使用 curl 模拟音频上传成功
  - 后端正确接收并保存文件
- [x] 修复 npm workspaces 中 `@types/express` 版本冲突
  - 在根目录 `package.json` 添加 `overrides`
  - 清理并重新安装依赖
- [x] 提交并推送到 GitHub：`92715f0`

### 下一步

- [x] 后端接入讯飞 ASR，将音频转为文字

---

## 2026-06-12 第三阶段：后端接入讯飞 ASR

### 已完成

- [x] 安装 ffmpeg 并确认可用路径（用于音频格式转换）
- [x] 安装后端依赖：`ws`、`ffmpeg-static`、`@types/ws`
- [x] 实现 `audioConverter.ts`：任意音频 → PCM 16kHz/16bit/单声道
- [x] 实现 `iflytekASR.ts`：讯飞流式听写 WebSocket 签名、分帧发送、结果拼接
- [x] 在 `/api/generate` 中接入 ASR，失败时返回 `error` 状态提示用户重录
- [x] 补充 `.env.example` 与 README 环境变量说明
- [x] 编译检查并本地测试 ASR 链路
- [x] 提交并推送到 GitHub

### 下一步

- [x] 接入 DeepSeek-V3 进行 Stage 1（意图提取 / 澄清）

---

## 2026-06-12 第四阶段：DeepSeek Stage 1 意图提取与澄清

### 已完成

- [x] 安装 `openai` SDK 调用 DeepSeek API
- [x] 实现 `deepseek.ts` 客户端配置（支持 DEEPSEEK_API_KEY / BASE_URL / MODEL）
- [x] 实现 `prompts/stage1.ts`，按设计文档构建 Stage 1 系统提示词
- [x] 实现 `services/stage1.ts`：JSON 模式调用、解析失败自动重试一次、字段归一化
- [x] 实现 `services/contextManager.ts`：更新会话上下文与聊天记录
- [x] 在 `/api/generate` 中接入 Stage 1：ASR 成功后送入 LLM，返回 `complete` / `need_clarification` / `error`
- [x] 更新 `.env.example` 与 README 开发状态
- [x] 全量编译通过
- [x] 本地测试：未配置 key 时返回明确错误；非法 key 时返回 401 并被捕获
- [x] 提交并推送到 GitHub

### 下一步

- [x] 接入 DeepSeek Stage 2，将结构化参数扩写为文生图 Prompt

---

## 2026-06-12 第五阶段：DeepSeek Stage 2 Prompt 扩写

### 已完成

- [x] 扩展 `@voice-draw/shared` 类型：
  - `SessionContext` 增加 `current_prompt` / `negative_prompt`
  - `GenerateResponse` 增加 `prompt` / `negative_prompt`
- [x] 实现 `prompts/stage2.ts`：按设计文档构建 Stage 2 系统提示词
- [x] 实现 `services/stage2.ts`：JSON 模式调用 DeepSeek 扩写 Prompt，解析失败自动重试一次
- [x] 更新 `services/contextManager.ts`：`applyStage2ToContext` 保存扩写结果到上下文
- [x] 在 `/api/generate` 中接入 Stage 2：Stage 1 `complete` 后自动调用，失败返回错误
- [x] 更新 README 开发状态
- [x] 全量编译通过
- [x] 本地测试非法 key 时正确捕获 401 错误
- [x] 提交并推送到 GitHub

### 下一步

- [x] 接入通义万相生图 / 图像编辑 API

---

## 2026-06-12 第六阶段：通义万相图像生成与编辑

### 已完成

- [x] 调研并确认 DashScope 文生图与图像编辑异步 API 流程
- [x] 实现 `services/imageGeneration.ts`
  - `generateImage(prompt, negativePrompt)`：调用 `wanx2.1-t2i-turbo` 文生图
  - `editImage(baseImageUrl, prompt)`：调用 `wanx2.1-imageedit` 指令编辑
  - 统一异步任务创建与轮询，含超时与失败处理
- [x] 更新 `services/contextManager.ts`：新增 `addImageToContext` 保存生成图片
- [x] 在 `/api/generate` 中完成端到端流程
  - Stage 1 complete → Stage 2 扩写 → 根据 `edit_mode` 选择文生图或图生图
  - 返回 `image_url` 与更新后的上下文
- [x] 补充 `DASHSCOPE_API_KEY` 到 `.env.example`，更新 README 开发状态
- [x] 全量编译通过
- [x] 本地测试非法 key 时正确捕获 401 错误
- [x] 提交并推送到 GitHub

### 下一步

- [x] 前端微信对话式 UI 实现
- [x] 多轮修改与上下文管理联调

---

## 2026-06-12 第七阶段：前端微信对话式 UI 与多轮交互

### 已完成

- [x] 安装 `zustand` 作为前端状态管理
- [x] 实现 `store/useChatStore.ts`
  - 维护 `appState`、`messages`、`sessionId`、`currentImageUrl`、`currentParams`、`nextEditMode`
  - 提供录音、上传、澄清、图片生成、错误、重置等状态迁移
- [x] 实现 UI 组件
  - `ChatMessageList`：消息列表 + 自动滚动
  - `ChatMessageItem`：用户语音气泡、AI 文字气泡、图片卡片
  - `SuggestionChips`：追问建议横向展示
  - `StatusBar`：当前状态提示
  - `ImageActions`：整张重画 / 开启新对话
  - `RecorderButton`：支持 disabled 与开始/结束回调
- [x] 重写 `App.tsx`：整合录音、上传、状态展示、多轮上下文
- [x] 本地启动前后端开发服务器，确认前端与后端均正常启动
- [x] 全量编译通过
- [x] 提交并推送到 GitHub

### 后续可优化

- [ ] 语音消息播放与重播
- [ ] 图片下载与放大查看
- [ ] 建议选项一键填入/朗读
- [ ] 错误重试与加载状态细节优化

---

## 2026-06-13 第八阶段：纯语音交互重构

### 目标

将前端从“按住说话 + 多处按钮”改为“单按钮持续聆听 + 语音命令控制一切”的纯语音交互模式。

### 已完成

- [x] 改造 `useRecorder.ts`
  - 基于 `AudioContext` + `AnalyserNode` 实现 VAD（语音活动检测）
  - 使用 `MediaRecorder.start(100)` 定期收集音频块，支持连续多轮输入
  - 检测到 3 秒静音后自动截取并触发 `onSegment`
  - 修复 cleanup 调用外部回调导致的无限循环问题
  - 麦克风权限错误向上抛出，由 `App.tsx` 统一处理
- [x] 改造 `RecorderButton.tsx`
  - 从“按住说话 / 松开发送”改为“点击切换聆听状态”
  - 支持待机、聆听中、说话中、即将发送、处理中五种状态
  - 显示麦克风错误信息
- [x] 新增前端本地意图识别
  - `services/intentRecognizer.ts`：覆盖停止、开始、重画、新对话、保存图片、继续修改
  - 支持正式说法与口语化表达
  - 支持连续命令拆分（如“保存，然后重新开始”）
  - 对长句中的简单命令做保守判断，避免误触发
- [x] 新增前端命令执行器
  - `services/commandHandler.ts`：执行命令并返回反馈话术、是否恢复聆听
  - 保存图片使用 `utils/downloadImage.ts`（与 Lightbox 共用）
- [x] 重写 `App.tsx`
  - 移除调试文字输入框
  - 移除 `ImageActions` 和 `SuggestionChips` 按钮
  - 点击按钮开始持续聆听，AI 回复后自动恢复聆听
  - 语音命令本地执行，非命令文本走 `/api/generate-text`
  - AI 处理中丢弃新的语音片段，避免并发请求
- [x] 扩展 `useChatStore.ts`
  - 新增 `isSpeaking`、`silenceDuration`、`setListening`、`setIdle` 等状态与方法
  - 新增 `addAssistantMessage` 用于命令反馈
- [x] 更新 `StatusBar.tsx`
  - 显示“聆听中，请说话”、“正在听你说话”、“即将发送”等状态
- [x] 简化 `ChatMessageItem.tsx` 和 `ChatMessageList.tsx`
  - 移除建议按钮的渲染与点击回调
- [x] 删除遗留组件文件
  - `components/ImageActions.tsx`
  - `components/SuggestionChips.tsx`
- [x] 新增后端 `/api/transcribe` 接口
  - `apps/server/src/routes/transcribe.ts`
  - 仅做 ASR，返回 `{ success, transcript }`
  - 在 `apps/server/src/index.ts` 注册路由
- [x] 前端 `services/api.ts` 新增 `transcribeAudio` 函数
- [x] 更新 `.gitignore`
  - 忽略调试截图 `frontend-*.png`
- [x] 更新文档
  - `README.md`：重写交互说明与功能列表
  - `design.md`：更新架构图、核心流程、API 设计、状态机、目录结构、变更记录
  - `WORK_LOG.md`：补充第八阶段记录
- [x] 全量编译通过
- [x] `npm run lint` 通过
- [x] 使用 agent-browser 验证页面加载与按钮切换正常
- [x] 提交并推送到 GitHub

### 关键修复

| 问题 | 原因 | 修复 |
|------|------|------|
| 第二轮语音无反馈 | `MediaRecorder.start()` 默认只在 stop 时返回音频，第一轮后无新数据 | 使用 `MediaRecorder.start(100)` 持续收集音频块 |
| 页面空白 | `useRecorder` cleanup 在 effect 中调用外部回调更新 store，导致无限渲染 | cleanup 只重置内部状态，不调用外部回调 |
| “停止”命令不关闭麦克风 | 识别到命令后只修改了 UI 状态 | 通过 `stopListeningRef` 真正调用 `recorder.stopRecording()` |
| 短命令“停”无法触发 | `minSpeechDuration` 500ms 太长 | 缩短至 200ms |
| 创作描述中嵌入命令词被误识别 | 简单命令对长句过于敏感 | 对 `stop/start/save_image/new_chat` 增加长度保守判断 |

### 语音命令清单

| 命令 | 示例说法 |
|------|----------|
| 停止聆听 | 停止、暂停、别说了、可以了、够了 |
| 整体重画 | 重画、重新画、再来一张、画得不好 |
| 新对话 | 新对话、重新开始、清空、从头来 |
| 保存图片 | 保存、下载、存下来、我要这张图 |
| 继续修改 | 修改、改一下、调整一下、换个风格 |

### 下一步

- [ ] 真实环境多轮语音端到端测试
- [ ] 根据测试结果继续扩展口语化命令词库
- [ ] 考虑接入更鲁棒的 VAD 方案
