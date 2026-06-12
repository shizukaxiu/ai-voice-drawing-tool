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

- [ ] 后端接入讯飞 ASR，将音频转为文字

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

- [ ] 接入 DeepSeek-V3 进行 Stage 1（意图提取 / 澄清）
