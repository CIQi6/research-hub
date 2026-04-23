# Research Hub 资源中心改造设计

- 日期：2026-04-24
- 状态：已确认，待实现
- 范围：将当前以成员为中心的资料展示站，重构为“成员 + 资源中心”双视角产品，并支持香港部署与 GitHub 自动发布

## 1. 背景

当前站点把资料塞在 `members.resources jsonb` 中。这种结构只够做玩具级列表，无法自然支撑以下需求：

- 首页独立资源流
- 资源类型与标签筛选
- 资源详情页
- 资源评论
- 收藏体系
- 后续热门排序、标签聚合与推荐

继续沿用 JSON 数组会直接导致查询困难、接口扭曲、前端状态混乱。结论：必须把资源提升为一等实体。

## 2. 已确认决策

### 2.1 部署

- 不使用 GitHub Pages。
- 部署目标为：GitHub + GitHub Actions + 腾讯云香港 Lighthouse/CVM + `yuuri.cn` 自定义域名。
- 应用保持 Next.js Node 运行模式，不做 `output: "export"`。

### 2.2 资料录入

- 首版只支持外链，不支持文件上传。
- 资源类型由用户手动选择，不做自动识别。
- 每条资源必须包含简短摘要。

### 2.3 首页与导航

- 首页采用 `A. Hybrid Dashboard`。
- 首页同时保留资源流与成员入口，但资源优先。
- 导航保留成员页，资源详情页成为核心内容页。

### 2.4 资源交互

- 资源卡片主体进入站内详情页。
- 资源卡片右上角提供“直达原链接”。
- 不做第三方内容内嵌预览，资源详情页负责承载元信息与互动。

### 2.5 产品方向

- 目标架构是“完整资源中心”。
- 首轮实现只做可落地的一层，不把推荐、复杂统计、自动识别等内容混进核心链路。

## 3. 目标产品结构

系统包含两个核心视角：

1. 作者视角：成员页、个人资料、我发布的资源。
2. 资源视角：资源流、资源详情、资源评论、标签、收藏。

成员仍然存在，但不再是资源的容器；资源是主实体。

## 4. 信息架构

### 4.1 首页

首页使用双栏结构：

- 左侧主区：资源流
- 右侧次区：活跃成员

首页顶部交互顺序：

1. 全局搜索
2. 类型筛选：`PDF / 网页 / 音频 / 视频 / 电子书`
3. 标签筛选

资源卡片展示：

- 类型徽标
- 标题
- 摘要
- 作者
- 标签
- 更新时间
- 进入详情按钮（卡片主体）
- 打开原链接按钮

成员卡片展示：

- 头像
- GitHub 用户名
- 研究方向
- 已发布资源数量或近期活跃状态

### 4.2 资源详情页

资源详情页是资源中心主页面，承担以下职责：

- 展示资源的完整元信息
- 提供访问原链接的明确入口
- 展示作者信息
- 承载资源评论
- 为后续相关推荐预留版面位置，但首版不接推荐逻辑

页面结构：

1. 顶部信息区：标题、摘要、类型、标签、作者、发布时间、收藏按钮、原链接按钮
2. 中部作者区：作者头像、用户名、研究方向、更多资源入口
3. 中部扩展区：相关推荐版位预留；Phase 1 只保留布局，不返回推荐数据
4. 底部评论区：资源评论列表与评论输入框

首版明确不做：

- 任意站外页面 iframe 内嵌
- PDF 在线预览
- 音视频播放器聚合

理由：跨域、兼容性、第三方限制和失败回退都会显著放大首版复杂度，收益极差。

### 4.3 成员页

成员页退回“作者页”角色。

页面结构：

1. 作者信息头部：头像、用户名、研究方向
2. 作者资源列表：该成员发布的资源
3. 成员评论区：保留现有成员评论能力

成员评论与资源评论不混用，避免一轮改造中把互动模型打穿。

### 4.4 个人编辑页

个人编辑页拆成两个独立区域：

1. 编辑个人资料
2. 管理我发布的资源

发布资源时手动填写：

- 标题
- 链接
- 类型
- 摘要
- 标签

首版不支持：

- 文件上传
- 类型自动识别
- 富文本编辑

### 4.5 收藏页

新增“我的收藏”页面，提供：

- 收藏资源列表
- 取消收藏
- 进入资源详情

首版不做收藏分组或收藏标签。

## 5. 数据模型设计

### 5.1 保留表：`members`

职责：作者身份与公开资料。

保留字段：

- `github_id`
- `github_username`
- `avatar_url`
- `field`
- `created_at`
- `updated_at`

废弃方向：

- 不再把资源存入 `members.resources`

### 5.2 新增表：`resources`

职责：资源主实体。

建议字段：

- `id uuid primary key`
- `owner_github_id bigint not null references members(github_id) on delete cascade`
- `title text not null`
- `url text not null`
- `type text not null`
- `summary text not null`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

约束：

- `type` 只允许：`pdf`、`web`、`audio`、`video`、`ebook`

索引建议：

- `(owner_github_id, created_at desc)`
- `(type, created_at desc)`

### 5.3 新增表：`tags`

职责：资源主题标签。

建议字段：

- `id uuid primary key`
- `slug text unique not null`
- `name text unique not null`

### 5.4 新增表：`resource_tags`

职责：资源与标签的多对多关系。

建议字段：

- `resource_id uuid not null references resources(id) on delete cascade`
- `tag_id uuid not null references tags(id) on delete cascade`

约束：

- `(resource_id, tag_id)` 唯一

### 5.5 新增表：`resource_comments`

职责：资源评论。

建议字段：

- `id uuid primary key`
- `resource_id uuid not null references resources(id) on delete cascade`
- `author_github_id bigint not null`
- `author_username text not null`
- `author_avatar text`
- `content text not null`
- `created_at timestamptz default now()`

索引建议：

- `(resource_id, created_at desc)`

### 5.6 新增表：`resource_bookmarks`

职责：资源收藏。

建议字段：

- `resource_id uuid not null references resources(id) on delete cascade`
- `user_github_id bigint not null references members(github_id) on delete cascade`
- `created_at timestamptz default now()`

约束：

- `(resource_id, user_github_id)` 唯一

## 6. 数据迁移策略

当前 `members.resources jsonb` 中已有历史资源数据。

迁移策略分三步：

1. 新建 `resources`、`tags`、`resource_tags`、`resource_comments`、`resource_bookmarks`
2. 编写一次性迁移脚本，将历史 `members.resources` 拆成 `resources` 行
3. 前端与 API 全部切换到新表

迁移后不立刻删除 `members.resources`，而是保留一个过渡窗口，待验证稳定后再清理旧字段。

原则：先迁移并切流，再删除旧结构，禁止反过来。

## 7. API 设计

### 7.1 资源 API

- `GET /api/resources`
  - 支持 `q`、`type`、`tag`、`owner`、`sort`
- `POST /api/resources`
  - 登录用户创建资源
- `GET /api/resources/[id]`
  - 返回资源详情、作者、标签、收藏状态、评论数
- `PATCH /api/resources/[id]`
  - 仅作者可修改
- `DELETE /api/resources/[id]`
  - 仅作者可删除

### 7.2 资源评论 API

- `GET /api/resources/[id]/comments`
- `POST /api/resources/[id]/comments`
- `DELETE /api/resources/[id]/comments/[commentId]`

删除权限：仅评论作者本人。

### 7.3 收藏 API

- `POST /api/resources/[id]/bookmark`
- `DELETE /api/resources/[id]/bookmark`
- `GET /api/me/bookmarks`

### 7.4 成员相关 API

- `GET /api/members/[id]/resources`
- `GET /api/tags`

现有成员评论 API 暂时保留，不纳入此次结构重写范围。

## 8. 前端组件与页面改造

### 8.1 新增页面

- `/resource/[id]`
- `/bookmarks`

### 8.2 重写页面

- `/`
- `/profile`
- `/member/[id]`

### 8.3 组件层级建议

- `ResourceList`
- `ResourceCard`
- `ResourceFilters`
- `ResourceDetail`
- `ResourceComposer`
- `ResourceComments`
- `BookmarkButton`
- `TagPicker`

目标是把“资源显示”和“成员显示”彻底拆开，避免继续把不同职责塞进一个组件。

## 9. 权限与行为约束

- 未登录用户：
  - 可浏览资源
  - 可浏览成员
  - 不可发布资源
  - 不可评论
  - 不可收藏

- 已登录用户：
  - 可发布资源
  - 可编辑自己的资源
  - 可删除自己的资源
  - 可评论资源
  - 可收藏/取消收藏

- 权限原则：
  - 资源编辑删除仅限作者
  - 评论删除仅限评论作者
  - 收藏唯一性由数据库约束保证

## 10. 部署设计

### 10.1 目标形态

- 代码托管：GitHub
- 应用部署：腾讯云香港 Lighthouse/CVM
- 域名：`yuuri.cn` + `www.yuuri.cn`
- 反向代理：Nginx
- 进程守护：`systemd`
- HTTPS：Let's Encrypt

### 10.2 运行模式

应用使用标准 Node 运行：

- `npm ci`
- `npm run build`
- `npm run start`

不做静态导出，不依赖 GitHub Pages。

### 10.3 环境变量

服务器持有真实环境变量，包括但不限于：

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `NEXTAUTH_URL` 或对应正式站点地址配置

原则：密钥只在服务器与 GitHub Secrets 中出现，不进入仓库。

## 11. GitHub 自动发布

部署链路：

1. push 到主分支
2. GitHub Actions 触发
3. 安装依赖
4. 执行 `npm run lint`
5. 执行 `npm run build`
6. 打包构建结果
7. 通过 SSH 传到香港服务器
8. 服务器替换版本
9. 重启 `systemd` 服务

服务器保存长期环境变量，GitHub Actions 只负责发布产物与重启服务。

## 12. 错误处理与回退

### 12.1 前端

- 资源列表加载失败：显示重试提示
- 资源详情不存在：显示 404 或明确的“资源不存在”
- 创建/编辑失败：表单内错误提示
- 收藏失败：按钮级错误提示，不阻塞页面其余部分

### 12.2 后端

- 参数校验失败：返回 400
- 未登录：返回 401
- 权限不足：返回 403
- 目标资源不存在：返回 404
- Supabase 写入异常：返回 500，并记录错误

### 12.3 数据迁移

- 迁移前备份当前 Supabase 数据
- 迁移脚本幂等或显式可重试
- 切换期间保留旧字段，避免前端与数据库同时失配

## 13. 测试策略

### 13.1 基础验证

每轮改造至少覆盖：

- 首页资源流展示
- 类型筛选
- 标签筛选
- 资源详情页
- 成员页资源列表
- 发布资源
- 编辑资源
- 删除资源
- 资源评论
- 收藏与取消收藏

### 13.2 部署前验证

本地必须通过：

- `npm run lint`
- `npm run build`

### 13.3 线上 smoke check

部署到香港节点后至少检查：

1. 首页可打开
2. GitHub 登录可用
3. 发布资源可用
4. 资源详情可访问
5. 收藏可用

## 14. 分阶段实现

### Phase 1

- 建表与数据迁移
- 首页资源流
- 资源详情页
- 类型筛选
- 标签体系
- 资源评论
- 收藏
- 个人页资源管理

### Phase 2

- 热门排序
- 标签聚合页
- 我的收藏筛选
- 后台统计

### Phase 3

- 推荐
- 相关资源
- 更复杂的内容消费体验

## 15. 明确暂不做

- 文件上传
- 自动类型识别
- 第三方页面/媒体内嵌预览
- 推荐算法
- 复杂统计后台
- 资源富文本编辑
- 海外/大陆双站拆分

## 16. 成功标准

本轮改造完成后，应满足：

- 用户可以独立发布一条资源，而不是把资源挂在成员 JSON 下
- 首页可以以资源为主浏览，同时保留成员入口
- 资源拥有独立详情页、评论和收藏
- 成员页可以作为作者页继续存在
- 项目可以部署到香港节点并通过 GitHub Actions 自动更新

这五条做不到，说明改造没有完成。
