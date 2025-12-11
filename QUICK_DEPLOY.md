# 快速部署指南

## 🚀 一键部署到 Vercel

### 方法一：通过 Vercel 按钮部署

点击下面的按钮直接部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YuGu0358/smart-lifestyle-assistant)

### 方法二：手动导入项目

#### 第一步：登录 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录

#### 第二步：导入项目

1. 点击 "Add New..." → "Project"
2. 选择 "Import Git Repository"
3. 找到并选择 `YuGu0358/smart-lifestyle-assistant` 仓库
4. 点击 "Import"

#### 第三步：配置项目

保持默认设置：
- **Framework Preset**: Other
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `pnpm install`

#### 第四步：配置环境变量（重要！）

在部署前，点击 "Environment Variables" 添加以下变量：

**必需的环境变量：**

```
NODE_ENV=production
```

**数据库配置（需要您自己的数据库）：**

```
DATABASE_HOST=your-database-host
DATABASE_PORT=4000
DATABASE_USER=your-database-user
DATABASE_PASSWORD=your-database-password
DATABASE_NAME=your-database-name
```

**OAuth 配置（需要申请 Manus OAuth）：**

```
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your-app-id
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
```

**应用配置：**

```
VITE_APP_TITLE=Smart Lifestyle Assistant
VITE_APP_LOGO=
```

#### 第五步：部署

1. 点击 "Deploy" 按钮
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，您会获得一个 URL，如 `https://your-project.vercel.app`

---

## 📋 部署前准备清单

### 1. 数据库准备

您需要一个 MySQL 数据库。推荐选项：

- **TiDB Cloud**（推荐）: https://tidbcloud.com
  - 免费套餐
  - 兼容 MySQL
  - Serverless 架构
  
- **PlanetScale**: https://planetscale.com
  - 免费套餐
  - MySQL 兼容
  
- **Railway**: https://railway.app
  - 内置 MySQL
  - 简单易用

**数据库设置步骤：**
1. 创建数据库实例
2. 获取连接信息（主机、端口、用户名、密码）
3. 在本地运行迁移：`pnpm run db:push`
4. 将连接信息填入 Vercel 环境变量

### 2. OAuth 配置

此应用使用 Manus OAuth 进行用户认证。

**如何获取 OAuth 凭据：**
1. 访问 Manus 开发者平台
2. 创建新应用
3. 设置回调 URL 为：`https://your-vercel-domain.vercel.app/api/oauth/callback`
4. 获取 App ID、Client ID 和 Client Secret

---

## ⚠️ 常见问题

### Q: 部署成功但页面显示 500 错误
**A:** 检查环境变量是否正确配置，特别是数据库连接信息。

### Q: OAuth 登录失败
**A:** 确保在 Manus OAuth 后台配置了正确的回调 URL。

### Q: 数据库连接失败
**A:** 
- 检查数据库是否允许来自 Vercel 的连接
- 确认数据库凭据正确
- 检查数据库迁移是否已运行

### Q: 构建失败
**A:** 查看 Vercel 构建日志，通常是依赖安装或环境变量问题。

---

## 🔧 本地开发

如果您想在本地运行此应用：

```bash
# 克隆仓库
git clone https://github.com/YuGu0358/smart-lifestyle-assistant.git
cd smart-lifestyle-assistant

# 安装依赖
pnpm install

# 创建 .env 文件并配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 运行数据库迁移
pnpm run db:push

# 启动开发服务器
pnpm run dev
```

---

## 📞 需要帮助？

- 查看详细部署文档：[DEPLOYMENT.md](./DEPLOYMENT.md)
- 查看项目 README：[README.md](./README.md)
- GitHub Issues: https://github.com/YuGu0358/smart-lifestyle-assistant/issues

---

**祝您部署顺利！🎉**
