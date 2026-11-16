# Home-01

拉美多品类经典电商首页，由导航、首屏轮播、服务权益、限时倒计时秒杀、个性化商品瀑布流及页脚六大核心板块组合而成。

### 组合链路
`home-01：header-01->carousel-01->services-08->flashsale-01->productlist-01->footer-01`

### 使用的组件 (Included Components)
- `Header-01` (`<header-01>`): 页面吸顶导航栏，含品牌 Logo、搜索栏、分类菜单及购物车/心愿单快捷入口。
- `Carousel-01` (`<carousel-01>`): 首屏响应式大幅活动轮播横幅，支持桌面端与移动端双视口自动轮播。
- `Services-08` (`<services-08>`): 品牌服务优势展示条（免邮、正品保障、快捷退换等服务权益）。
- `FlashSale-01` (`<flashsale-01>`): 限时倒计时特惠秒杀板块，内置 `<flashcard-01>` 进度条商品卡片。
- `ProductList-01` (`<productlist-01>`): 为你精选热门商品瀑布流展示列表，内置 `<card-01>` 响应式商品卡片。
- `Footer-01` (`<footer-01>`): 页面全局底部，包含品牌介绍、分类导航矩阵、邮件订阅与支付保障徽章。

### 尺寸与响应式
- 整体遵循全站最大内容宽度（`w-full max-w-content mx-auto px-4 lg:px-6`）。
- 移动端：自适应单列流式布局，轮播与秒杀卡片支持平滑横向手势触摸滑动。

