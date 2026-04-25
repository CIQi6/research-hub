# Research Hub 全链路交互打磨设计

- 日期：2026-04-25
- 状态：已确认，待实现
- 范围：首页浏览筛选、资源卡片、资源详情、成员页、访客态入口、基础交互测试

## 1. 背景

当前资源中心主体功能已经可用，但交互质量还停在“能跑”阶段。实测发现的问题集中在状态反馈、主次层级和访客态路径：

- 首页筛选时列表保留旧结果，标题变为“正在更新...”，统计卡还会跟着筛选结果变化，用户会误以为全站资源消失。
- 搜索、类型、标签筛选只存在本地 state，刷新、分享、后退都会丢失当前视图。
- `/profile` 访客访问时先显示加载，再跳回首页，缺少解释和明确下一步。
- `/bookmarks` 访客态只有一句提示，缺少登录入口。
- 资源卡同时有卡片主体、右上原链接、底部详情，主操作不够明确。
- 资源详情页存在“相关推荐：暂无相关推荐”的死占位，打开详情后没有自然的继续浏览路径。
- 成员页是头像、资源和留言的纵向堆叠，缺少作者维度的概览与分区。

这类问题不会导致构建失败，但会直接制造“卡顿”“跳转突兀”“不知道下一步点哪”的体感。

## 2. 参考产品

### 2.1 Semantic Scholar

Semantic Scholar 的核心不是装饰，而是稳定的搜索、过滤、Library 和 Research Feeds。对本项目可借鉴：

- 搜索与过滤是可恢复、可分享的页面状态。
- 资源摘要要降低判断成本。
- 收藏不是孤立按钮，应当服务“之后继续读”的路径。

参考：https://www.semanticscholar.org/product

### 2.2 Hugging Face Papers

Hugging Face Papers 的强点是浏览节奏：`Daily / Weekly / Monthly` 一类时间维度让用户马上知道自己在看哪种流。对本项目可借鉴：

- 列表顶部提供明确排序或时间视图。
- 卡片操作密度可以高，但必须有一个主操作。
- 外链可以存在，但不能抢掉进入站内详情的主路径。

参考：https://huggingface.co/papers/trending

### 2.3 Zotero

Zotero 的 collections 与 tags 模型说明：标签不是装饰徽标，而是组织和筛选入口。对本项目可借鉴：

- 标签点击应能形成稳定筛选状态。
- 标签区域应随浏览任务服务发现，不只是展示。
- 收藏页后续可以演化为 collection，但本轮不做收藏分组。

参考：https://www.zotero.org/support/collections_and_tags

## 3. 目标

本轮只解决交互丝滑性，不扩张产品边界。

完成后应达到：

1. 首页筛选、搜索、排序稳定、可分享、可后退恢复。
2. 用户能一眼分清资源卡主操作和辅助操作。
3. 详情页有自然的继续浏览路径。
4. 访客态入口不再无解释跳走，而是显示可行动的登录 CTA。
5. 成员页从资料堆叠变成作者视角 dashboard。
6. 移动端没有明显挤压、重叠、误触和状态抖动。

## 4. 非目标

本轮明确不做：

- AI 推荐。
- 推荐算法。
- 收藏分组或 collection。
- 复杂统计后台。
- 文件上传体验重做。
- 登录系统重构。
- 数据库 schema 大改。
- 新设计系统或主题换肤。

## 5. 首页交互设计

### 5.1 URL 化筛选

首页资源查询状态写入 URL：

- `q`: 搜索关键词
- `type`: `pdf | web | audio | video | ebook`
- `tag`: 标签 slug
- `sort`: `latest | discussed | bookmarked`

示例：

```text
/?q=infra&type=web&tag=ai-infra&sort=discussed
```

行为要求：

- 首次加载从 URL 初始化状态。
- 用户输入搜索后使用 debounce 更新 URL。
- 点击类型、标签、排序后更新 URL。
- 浏览器后退、前进能恢复对应筛选。
- 清空按钮移除所有筛选参数，保留默认 `sort=latest` 或直接省略。

实现上优先使用 `useRouter`、`useSearchParams` 和 `startTransition`，避免直接读写 `window.location`。

### 5.2 统计与结果分离

顶部统计卡固定表示全站概览：

- 资源总数
- 成员总数
- 标签总数
- 文章总数

筛选结果数量移动到列表标题旁：

```text
最新资源 · 2 条结果
```

加载筛选时不要把全站统计置零。列表可以显示轻量 loading bar 或按钮 pending 状态，但不能让用户误以为数据丢失。

### 5.3 排序 Tab

资源列表顶部新增排序 tab：

- `最新`
- `有讨论`
- `收藏多`

排序只改变列表顺序，不改变统计。

首版规则：

- `latest`: `updated_at desc`
- `discussed`: `comment_count desc, updated_at desc`
- `bookmarked`: `bookmark_count desc, updated_at desc`

如果后端暂时不能高效排序，先在 API 中明确实现小规模排序；不要在前端偷偷排序不同分页结果。

### 5.4 搜索与筛选布局

桌面端：

- 搜索框占主宽度。
- 类型筛选使用 segmented button。
- 标签使用横向流式 chips。
- 排序 tab 放在资源列表标题区域。

移动端：

- 搜索框独占一行。
- 类型和标签允许横向滚动。
- chip 高度稳定，避免点击后布局跳动。
- sticky header 下方保留足够间距，避免焦点状态被遮挡。

## 6. 资源卡片设计

### 6.1 主操作

整张卡片主体进入站内详情页，这是唯一主操作。

具体结构：

- 顶部：类型 badge、最多 2 个标签、右侧原链接图标按钮。
- 中部：标题、摘要、来源域名。
- 底部：更新时间、评论数、收藏数。

删除底部重复的“详情”文本链接。重复入口是视觉噪音。

### 6.2 原链接按钮

原链接保留，但降级为辅助图标按钮：

- 使用 external-link 图标。
- 文案在桌面可显示为“原链接”，移动端只显示图标。
- 必须有 `aria-label`，格式为 `打开原链接：资源标题`。
- 失效或缺失 URL 时显示 disabled 状态，不占据过大视觉权重。

### 6.3 Hover 与 Focus

卡片交互反馈：

- hover 时只提升边框和轻微阴影。
- focus-visible 时高亮整卡。
- 原链接按钮的 hover 不应触发整卡导航。

不能引入大幅动画。资源列表是阅读型界面，过度动效只会显得廉价。

## 7. 资源详情页设计

### 7.1 顶部信息

保留当前详情信息结构，但优化主次：

- 标题和摘要为视觉中心。
- 收藏与打开原链接放在右上操作区。
- 来源、更新、讨论、收藏四个信息块保留。

移动端操作区自动换行，按钮宽度不强行撑满整屏。

### 7.2 继续浏览路径

删除“相关推荐：暂无相关推荐”的死占位，替换为两个真实区块：

1. 同作者更多资源
2. 同标签资源

首版不做算法，只做确定性查询：

- 同作者更多资源：`owner_github_id` 相同，排除当前资源，最多 3 条。
- 同标签资源：任一标签相同，排除当前资源，最多 3 条。

如果没有结果，隐藏对应区块，不显示空壳。

### 7.3 评论区

访客态评论区改成明确 CTA：

```text
登录后可以参与讨论、回复和收藏资源。
[GitHub 登录]
```

已登录态保持现有输入框与评论线程。

评论加载失败时保留详情页主体，只在评论区内显示错误。

## 8. 成员页设计

成员页定位为作者 dashboard，不再只是资料页。

### 8.1 作者头部

头部展示：

- 头像
- GitHub 用户名
- 研究方向
- 加入时间
- 资源数
- 文章数
- 留言数

资源数、文章数、留言数用紧凑 stat chips，不做大卡片。

### 8.2 分区

成员页内容分为三个区：

- 资源
- 文章
- 留言

桌面端可以使用 tab；移动端也使用 tab，不把三块内容直接长堆。默认打开资源 tab。

空状态必须解释清楚：

- 没有资源：`这个成员还没有发布资源。`
- 没有文章：`这个成员还没有发布文章。`
- 没有留言：`还没有留言。`

### 8.3 返回路径

返回链接文案统一为 `返回资源中心`，不要只写 `返回`。上下文越少，用户越要猜。

## 9. 访客态设计

### 9.1 Profile

访客访问 `/profile` 不再先加载再跳回首页。页面直接显示登录墙：

- 标题：`登录后发布资源和文章`
- 描述：说明登录后可管理个人资料、发布资源、写文章。
- 主按钮：`GitHub 登录`
- 次按钮：`返回资源中心`

不自动跳转。自动跳转是糟糕的默认行为，用户还没读完就被赶走。

### 9.2 Bookmarks

访客访问 `/bookmarks` 显示登录墙：

- 标题：`登录后查看收藏`
- 描述：说明收藏用于保存之后要继续看的资源。
- 主按钮：`GitHub 登录`
- 次按钮：`浏览资源`

### 9.3 Bookmark Button

详情页访客点击收藏按钮时可以直接触发 `signIn("github")`，但按钮文案必须明确：

```text
登录后收藏
```

如果登录配置不可用，显示按钮级错误，不影响详情页阅读。

## 10. 数据与 API 调整

### 10.1 Resource List API

`GET /api/resources` 增加 `sort` 参数：

- `latest`
- `discussed`
- `bookmarked`

非法 sort 回退为 `latest`。

### 10.2 Related Resource API

可选方案：

1. 在 `GET /api/resources/[id]` 中返回 `related_by_owner` 和 `related_by_tag`。
2. 新增 `GET /api/resources/[id]/related`。

推荐方案 2。理由：详情主体和相关资源可以独立失败，避免一个辅助区块拖垮详情页。

返回结构：

```ts
interface RelatedResourcesPayload {
  by_owner: ResourceSummary[];
  by_tag: ResourceSummary[];
}
```

### 10.3 Member API

成员页需要资源数、文章数、留言数。若当前 `GET /api/members/[id]` 已能带资源数，则补齐文章数和留言数；否则成员页可以并发请求后在前端计算。

优先不做 schema 改动。

## 11. 状态流

### 11.1 首页

```text
URL searchParams
  -> parse filters
  -> render controls
  -> fetch resources
  -> update list result
```

用户操作：

```text
control change
  -> optimistic control state
  -> debounced URL replace/push
  -> fetch with AbortController
  -> ignore aborted response
  -> commit latest result
```

搜索输入使用 debounce，类型、标签、排序立即更新。

### 11.2 详情页

```text
resource detail loads
  -> render main detail
  -> load comments
  -> load related resources independently
```

相关资源失败只显示小错误或直接隐藏区块，不影响主体。

### 11.3 访客态

```text
session loading
  -> short loading only while auth status unknown
unauthenticated
  -> render login wall
authenticated
  -> render management or bookmarks content
```

禁止在 unauthenticated 时自动 `router.push("/")`。

## 12. 错误处理

- 首页资源列表失败：保留上一次成功结果，显示 `资源列表更新失败，已保留上一次结果。`
- 首页初始加载失败：显示空结果和错误提示，统计使用可用数据。
- 详情页主体失败：显示资源不存在或加载失败，并提供返回资源中心。
- 相关资源失败：隐藏相关区块或显示轻量错误，不阻断页面。
- 评论失败：只在评论区显示错误。
- 登录配置不可用：按钮级提示 `登录暂不可用，请稍后再试。`

## 13. 可访问性与性能

- 所有 icon-only 按钮必须有 `aria-label`。
- 筛选按钮使用 `aria-pressed`。
- tab 使用 `role="tablist"`、`role="tab"` 或现有 UI 组件的等效语义。
- 搜索输入保留 `aria-label`。
- 列表 loading 不使用整页 spinner。
- fetch 必须使用 `AbortController` 避免竞态提交旧响应。
- 不引入重型动画库。
- 不引入新状态管理库。

## 14. 测试策略

### 14.1 单元测试

新增或补充：

- resource query sort 参数解析。
- 首页 filter state 与 query string 互转。
- related resources 查询参数排除当前资源。
- 访客态登录墙组件的静态渲染逻辑。

### 14.2 手动浏览器测试

必须覆盖：

1. 首页输入搜索后 URL 更新，刷新后状态保留。
2. 类型、标签、排序点击后结果更新且统计卡不跳零。
3. 清空筛选后 URL 和控件恢复默认。
4. 资源卡点击主体进入详情，点击原链接不触发站内导航。
5. 详情页显示同作者或同标签资源；没有结果时不显示空壳。
6. 访客访问 `/profile` 显示登录墙，不自动跳回首页。
7. 访客访问 `/bookmarks` 显示登录墙和浏览资源入口。
8. 成员页 tab 切换资源、文章、留言，移动端不挤压。

### 14.3 构建验证

每轮必须通过：

```bash
npm test
npm run lint
npm run build
```

当前测试脚本会出现 Node `MODULE_TYPELESS_PACKAGE_JSON` warning，这是已有工程配置问题；本轮不要求处理，除非改动测试运行方式。

## 15. 分阶段实现

### Phase 1: 首页状态稳定

- URL 化筛选。
- sort 参数。
- 统计与筛选结果分离。
- 清空筛选。
- 单元测试。

### Phase 2: 卡片与详情继续浏览

- 资源卡主次重排。
- 删除重复详情入口。
- 相关资源 API。
- 详情页同作者、同标签资源区块。

### Phase 3: 访客态与成员页

- Profile 登录墙。
- Bookmarks 登录墙。
- 评论区访客 CTA。
- 成员页 dashboard 头部和 tabs。

### Phase 4: 浏览器验收

- 桌面视口检查。
- 移动视口检查。
- 首页、详情、成员、访客态路径 smoke test。

## 16. 成功标准

本轮完成后，用户从首页到详情、收藏、成员页的路径应该满足：

- 筛选不会抖成“数据丢失”。
- URL 能表达当前资源流状态。
- 卡片主操作一眼可见。
- 详情页看完后还有下一步。
- 访客知道为什么不能发布、收藏、评论，并知道怎么登录。
- 成员页能清楚回答“这个人贡献了什么”。

这些做不到，就不是交互打磨完成，只是换了一层皮。
