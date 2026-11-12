# 商品数据与 SDK 契约

适用于新电商项目的数据准备及商品、购物车、收藏、结账相关修改。只需首次准备时读取本文件；其他页面复用既定契约。接口以本包SDK的实际实现为准。

## 数据源选择与保护

1. 已有有效 `js/data.js`：复用，改页面不重新造商品、不改变商品 ID。
2. 用户给出真实 API：不生成 mock；编写字段适配器，数据加载完成后再 `SDK.init(normalizedProducts, config)`、注册/刷新数据组件。失败显示错误及重试，不能用 mock 假装 API 成功。接口凭据留在后端，预览代理不发送写入请求。
3. 无真实数据源时调用同包 [Mock Data 技能](../../generate-mock-data/SKILL.md)。生成参数、样本、来源和验证流程只在该技能维护；主技能与本接口参考不再维护生成工作流。
4. 只有用户明确重建数据时才重建，现有 SDK、配置、购物车和订单保留。配置在 js/app.js，禁止新建 commerce-config.js。

## 统一商品格式

| 字段 | 约定 |
|---|---|
| `id` | 非空唯一字符串；新 mock 使用 `B` + 9 位大写字母数字。真实数据保留原 ID，并将数字 ID 归一化为字符串 |
| `name/brand/category` | 非空文本，分类/品牌用于实际筛选 |
| `main_image/images` | 主图与真实图片路径数组；有条件再给 3–5 张，不能为了数量复制同一张 |
| `final_price` | 有限非负数字，统一货币，展示前保持数值，不塞货币符号 |
| `original_price/discount` | 可选；原价必须大于售价，折扣为 `round((1-final/original)*100) + '%'`，无原价不显示折扣 |
| `rating/reviews_count` | 0–5 数值/非负整数；mock 默认评分 3–5、评论数 0–500 |
| `monthly_sales` | 展示文本，不作为可靠数值排序依据 |
| `description/features/specifications` | 简介、特性字符串数组、`{key,value}` 规格数组；与行业、语言、素材相符 |
| `variants/variant_options` | 数组，没有变体时为 `[]`；规格值和价格取真实已定义数据 |
| `comments` | 0–5 条演示评论 `{date,rating,content,user_name}`，允许 `[]`；不伪装真实用户评价 |

所有页面只读同一份 `window.productData`，不能在页面/卡片里复制数组。新生成的 data.js 同时提供 `window.storeData.getAll/getById/getByCategory/formatPrice/toCartItem` 薄门面，查询/格式化委托 SDK，购物车映射保留 final_price 数值，不另建数据副本。数据工具 `action:'validate'` 检查字面量、唯一 ID、字段、数值和折扣；浏览器还要验证图片可加载、`SDK.init()` 后 `SDK.count()` 等于实际条数。

## `window.SDK`：商品查询，只读数据

内置 `assets/commerce/sdk.js` 保留旧项目真实实现，不把旧 `sdk.md` 中未实现的能力作为可用 API。以下链式用法已作为验收契约：

```javascript
SDK.init(window.productData, window.commerceConfig);

const products = SDK.list()
  .filter({ category: 'Daypacks', priceRange: { min: 50, max: 150 } })
  .sort('final_price', 'asc')
  .slice(0, 12)
  .result();

const searched = SDK.search('trail').limit(8).result();
const product = SDK.get(productId); // 商品对象或 null
const saved = SDK.get(APP.wishlist.list()).result();
const amount = SDK.price(product.final_price); // 仅供展示
```

- 查询入口：`list/search/deals/popular/newest/random/get/brands/categories/count/price`；`init` 必须在数据就绪后调用。
- QueryBuilder 支持 `filter/sort/limit/slice/result/count`。`.result()` 返回数组，之后不能再 `.count()` 链式调用；计数应在 builder 上调用。
- `get(string)` 返回对象或 null；`get(array)` 返回 builder。`brands()/categories()` 返回字符串数组；传一个字符串返回 builder，不支持传数组。
- `filter` 支持字符串精确值、数组多值、`rating:{min}`、`priceRange:{min,max}`。不要使用未实现的 `final_price:{min,max}`、`fn` 或顶层 `SDK.filter/sort/limit/slice`。
- 字符串 `search` 查 name/brand/category/description；对象查实际字段，如 `{name:'trail',brand:'Brand'}`，没有 `title→name` 别名。
- 为避免 options 模式返回类型不一致，优先入口不传 options，再链式筛选/排序/分页。
- `popular()` 实际只按评分排序；`newest()` 试图对 monthly_sales 相减，遇展示文本不能视为可靠新品排序。需要真正“最新”时补稳定时间字段和小型适配器，不能拿 ID 或销量文案伪称日期。
- `random` 的旧实现不是可靠洗牌，不将其作为推荐稳定性的保证。稳定演示排序由生成器 seed 和显式数组/排序规则决定。
- `price(null)` 返回空串。价格输入必须是数字；不支持文档描述的本地化字符串反解析、priceField、formatPrice 配置。

## `window.APP`：电商状态、事件和操作

内置 `assets/commerce/ec-sdk.js` 基于旧项目适配，接口职责保持分离。已有项目的 SDK 不替换，先检查其同步/异步和存储契约。

| 模块 | 主要方法与返回 |
|---|---|
| `account` | `register/login/update` **异步**返回 `{success,user?,code?,message?}`；`logged/current/list/exists/logout/delete` 维持查询或对象/模块返回 |
| `cart` | `add/update/delete/clear` 返回 cart 模块；`list/get/count/total/empty/has/qty` 读取状态 |
| `wishlist` | `add/delete/clear/toggle` 返回 wishlist 模块；`list/has/count/empty` 读取商品 ID |
| `order` | `create/cancel` 返回结果对象，`list/get/count/uuid` 查询；仅 pending 可取消 |
| `coupon` | 固定金额抵扣，`apply` 返回结果对象；仅 `cart.total() > amount` 可使用；下单后标记已用 |
| `on/off` | 订阅/取消具体 handler，不用 `APP.off(event)` 误删别的组件监听 |

```javascript
const product = SDK.get(productId);
if (!product) {
  showMissingProduct();
  return;
}

APP.cart.add({
  id: product.id,
  name: product.name,
  image: product.main_image,
  price: product.final_price // 绝不能传 SDK 返回的格式化 product.price
}, quantity);

APP.on('CART_ADD', payload => {
  if (payload.success === false) {
    showActionError(payload.code);
    return;
  }
  refreshCartBadge();
});
```

- `SDK` 的商品 ID、购物车行 `id`、订单 `id` 不同。购物车 `add` 用商品 ID，`update/delete/get` 用购物车行 ID；心愿单用商品 ID。选择变体时设计稳定行键及 productid 映射，不能丢失选择或混合不同规格数量。
- cart/wishlist 的成功事件常没有 `success:true`，不能用 `!payload.success` 判失败；严格比较 `=== false`。未登录时写入被忽略并发出 2001/3001，UI 不能先假报成功。订单/账户/优惠券结果对象按 `success` 处理。
- 账户、购物车、收藏、优惠券、订单只通过 APP 修改，商品查询与金额展示只通过 SDK。组件禁止另建一套 localStorage 状态。
- 本包适配：账户注册/登录/改密使用 `await`，随机盐 + PBKDF2，不保存明文密码；邮箱归一化。页面防重复提交并处理 Web Crypto 不可用错误。账户只是本地演示，不是后端认证或真实支付，不能索取/保存银行卡密码等凭据。
- 本包存储增加项目前缀，购物车、收藏和已应用的优惠券选择按账户分开；不会读取/迁移旧站无前缀键。历史订单保存商品快照，不能因现价/商品删除而重算旧订单。
- 同页 APP 事件驱动局部 refresh；跨 iframe/窗口收到 `storage` 事件也刷新有关组件。不会因此重载 iframe。初始化与订阅必须幂等，断开组件时解绑。

最低验收：搜索/筛选/排序/分页、未知商品、加购与行数量、收藏切换、未登录错误、账户切换隔离、折扣与优惠券、非空购物车下单→购物车清空→订单快照、单页改动不重建数据。

用户JSON导入的图片字段保留源相对路径，渲染时显式storeData.imageUrl(path)拼接CDN，不写回数据。二次分类成功后SDK.category/categories/filter使用新分类，source_category保留原类追溯；源品类过多须category_map完整映射，不默认前5源类+More。参见import-products技能。

## 加购与注册生成提示（不新增校验）

- 加购成功保持当前页面/浏览位置，更新数量并可Toast反馈；默认不自动打开购物车抽屉或跳转cart页。打开购物车由用户主动点击入口触发。
- 注册表单同时提供用户名、邮箱、手机号、密码，使用对应SDK字段传递资料；保留异步账户接口及既有登录守卫。不将用户名等同邮箱，不漏掉手机号。
- 账户/支付的实现限制只在开发交付说明或metadata_directory记录，不在店铺界面插入演示/模拟声明；不能反向宣称未实现的认证、收款或配送能力。
- 上述仅为生成提示，不新增运行时校验器、ready门禁、统一拦截或自动改写。
