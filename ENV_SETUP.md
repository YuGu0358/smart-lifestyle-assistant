# 环境变量配置指南

## 🔧 Vercel 环境变量设置

### 访问环境变量设置页面

1. 登录 Vercel：https://vercel.com
2. 选择您的项目
3. 点击 "Settings" 标签
4. 在左侧菜单选择 "Environment Variables"

---

## 📋 必需的环境变量

### 1. 基础配置（必需）

```bash
NODE_ENV=production
VITE_APP_TITLE=Smart Lifestyle Assistant
```

**说明**：
- `NODE_ENV`: 设置为 production 启用生产模式
- `VITE_APP_TITLE`: 应用标题，显示在浏览器标签和页面上

---

### 2. 数据库配置（必需）

```bash
DATABASE_HOST=your-database-host
DATABASE_PORT=4000
DATABASE_USER=your-database-user
DATABASE_PASSWORD=your-database-password
DATABASE_NAME=your-database-name
```

**如何获取数据库：**

#### 推荐选项：TiDB Cloud（免费）

1. 访问：https://tidbcloud.com
2. 注册并登录
3. 创建新集群：
   - 选择 "Serverless Tier"（免费）
   - 选择区域（推荐选择离您最近的）
   - 点击 "Create"
4. 等待集群创建完成（约 1-2 分钟）
5. 点击 "Connect" 获取连接信息：
   - Host: `gateway01.xxx.prod.aws.tidbcloud.com`
   - Port: `4000`
   - User: `xxxxxx.root`
   - Password: 创建时设置的密码
   - Database: 默认为空，可以创建一个新的

#### 其他选项

- **PlanetScale**: https://planetscale.com
- **Railway**: https://railway.app
- **AWS RDS**: https://aws.amazon.com/rds/
- **自建 MySQL**: 任何 MySQL 5.7+ 服务器

---

### 3. OAuth 配置（可选，但推荐）

```bash
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your-app-id
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
```

**说明**：
- 这些配置用于用户认证和登录
- 如果不配置，应用仍可访问，但登录按钮会被禁用
- 需要从 Manus OAuth 平台获取

**如何获取 OAuth 凭据：**

1. 联系 Manus 团队申请 OAuth 应用
2. 提供您的回调 URL：`https://your-vercel-domain.vercel.app/api/oauth/callback`
3. 获取：
   - App ID
   - Client ID
   - Client Secret

---

### 4. 分析配置（可选）

```bash
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

**说明**：
- 用于网站访问统计
- 如果不需要分析功能，可以留空

---

## 🚀 设置步骤

### 在 Vercel 中添加环境变量

1. 在 Vercel 项目的 "Environment Variables" 页面
2. 对于每个变量：
   - 在 "Key" 输入框输入变量名（如 `NODE_ENV`）
   - 在 "Value" 输入框输入变量值（如 `production`）
   - 选择环境：勾选 "Production", "Preview", "Development"
   - 点击 "Add"
3. 添加完所有变量后，点击 "Save"
4. 重新部署项目：
   - 进入 "Deployments" 标签
   - 点击最新部署右侧的三个点
   - 选择 "Redeploy"

---

## ✅ 验证配置

部署完成后：

1. 访问您的 Vercel URL
2. 检查页面是否正常加载
3. 如果配置了 OAuth，检查 "Get Started" 按钮是否可点击
4. 打开浏览器控制台（F12），查看是否有错误信息

---

## ⚠️ 常见问题

### Q: 页面显示 "An unexpected error occurred"

**A**: 检查以下内容：
1. 确认所有必需的环境变量都已设置
2. 特别检查 `VITE_OAUTH_PORTAL_URL` 和 `VITE_APP_ID` 是否正确
3. 如果暂时没有 OAuth 配置，确保使用最新的代码（已修复缺失环境变量的处理）

### Q: 数据库连接失败

**A**: 
1. 确认数据库凭据正确
2. 检查数据库是否允许来自 Vercel 的连接（通常需要允许所有 IP 或添加 Vercel IP 白名单）
3. 确认数据库服务正在运行

### Q: OAuth 登录失败

**A**:
1. 确认回调 URL 配置正确：`https://your-vercel-domain.vercel.app/api/oauth/callback`
2. 检查 OAuth 凭据是否正确
3. 确认 OAuth 应用状态为激活

### Q: 修改环境变量后没有生效

**A**: 
1. 修改环境变量后必须重新部署
2. 在 Vercel 项目中进入 "Deployments" 标签
3. 点击最新部署的 "Redeploy"

---

## 🔒 安全提示

1. **不要**将环境变量提交到 Git 仓库
2. **不要**在公开场合分享数据库密码或 OAuth 密钥
3. 定期更换数据库密码
4. 使用强密码
5. 仅在 Vercel 后台配置敏感信息

---

## 📞 需要帮助？

- 查看 [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
- GitHub Issues: https://github.com/YuGu0358/smart-lifestyle-assistant/issues
