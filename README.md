# 万叶集 · 植物手帖

一个面向家庭共同养护场景的 AI 植物手帐。用户可以上传真实植物照片，由 Gemini 识别植物、生成养护建议、完成主体抠图，并生成和风水彩插画；家庭成员可以共同查看浇水状态、记录养护行为，并通过日历和手帐回顾植物的生命轨迹。

## 核心体验

- **AI 植物识别**：根据照片识别品种、拉丁名，并建议浇水、施肥、光照和温度。
- **AI 图像处理**：生成干净的植物主体图，以及三张可选择的和风水彩插画。
- **家庭协作**：通过家庭空间共享植物状态和养护记录，减少重复浇水与信息差。
- **养护日历与手帐**：以卡片日历和时间线呈现浇水、施肥、修剪、换盆与备注。
- **响应式界面**：针对桌面横屏与移动端分别适配。
- **Local-first**：除 AI 请求外，演示数据保存在浏览器本地，无需数据库即可体验完整流程。

## 技术栈

Next.js 16、React 19、TypeScript、Tailwind CSS、Google Gemini Image API、Sharp。

## 本地运行

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 4173
```

打开 <http://127.0.0.1:4173/>。

植物、家庭成员与养护记录保存在浏览器的 `balcony-journal.demo.v1` 中。删除该 localStorage 条目即可恢复初始演示数据。

## 配置 Google Gemini

复制 `.env.example` 为 `.env.local`，并填入自己的 Google AI Studio API Key：

```dotenv
NEXT_PUBLIC_APP_TITLE=Balcony Journal
NEXT_PUBLIC_APP_DESCRIPTION=A tactile family plant-care journal

GOOGLE_AI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GOOGLE_AI_MODEL=gemini-3.1-flash-image
GOOGLE_AI_API_KEY=your_google_ai_studio_key
```

API Key 只由 Next.js 服务端路由读取。不要添加 `NEXT_PUBLIC_` 前缀，也不要提交 `.env.local`。

添加植物流程包含三个服务端 AI 步骤：

1. 识别植物并生成默认养护建议。
2. 生成主体抠图并移除白色背景。
3. 基于原照片生成三张和风植物水彩候选图。

## 数据与安全

- 仓库不包含 API Key，所有密钥通过部署环境变量配置。
- 原始照片仅在用户主动触发 AI 流程时发送给所配置的模型服务。
- 浏览器本地数据不会自动同步到其他设备。
- 若用于生产环境，请补充账户体系、数据库、对象存储、访问控制、限流与内容安全机制。

## 检查

```bash
npm run lint
npm run build
```
