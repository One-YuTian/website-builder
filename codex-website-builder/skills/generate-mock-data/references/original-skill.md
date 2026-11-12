---
name: generate-mock-data
description: 生成模拟商品数据的标准流程 - 输出符合SDK规范的 productData
---
# 生成模拟数据技能

当需要生成模拟商品数据时，加载此技能获取标准流程。

## 流程

1. 确定数据参数（数量、分类、品牌、价格范围）
2. 生成商品 ID（B + 9位大写字母数字）
3. 为每条商品生成完整字段
4. 输出 js/data.js 文件
5. 验证数据格式正确

## 数据字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | B + 9位大写字母数字，如 B0FZT96LRN |
| name | string | 是 | 商品名称 |
| brand | string | 是 | 品牌名 |
| category | string | 是 | 分类名 |
| main_image | string | 是 | https://dummyimage.com/400x400/E0E0E0/444444.png |
| images | string[] | 是 | 图片URL数组（3-5张） |
| final_price | number | 是 | 最终售价 |
| original_price | number | 否 | 原价（约40%商品有此字段） |
| discount | string | 否 | 折扣标签如 "15%"（有original_price时必填） |
| rating | number | 是 | 评分 3.0-5.0 |
| reviews_count | number | 是 | 评论数 0-500 |
| monthly_sales | string | 是 | "XX+ bought in past month" |
| description | string | 是 | 1-2句商品描述 |
| features | string[] | 是 | 1-3条特性 |
| specifications | object[] | 是 | 2-4条规格 {key, value} |
| variants | object[] | 否 | 变体列表 |
| variant_options | object[] | 否 | 变体选项 |
| comments | object[] | 是 | 0-5条评论 {date, rating, content, user_name} |

## 输出示例

```javascript
window.productData = [
  {
    id: 'X7K2P9MNBV',
    name: 'Wireless Bluetooth Headphones',
    brand: 'TechPro',
    category: 'Electronics',
    main_image: 'https://dummyimage.com/400x400/E0E0E0/444444.png',
    images: [
      'https://dummyimage.com/400x400/E0E0E0/444444.png',
      'https://dummyimage.com/400x400/CCCCCC/333333.png',
      'https://dummyimage.com/400x400/E0E0E0/444444.png'
    ],
    final_price: 79.99,
    original_price: 129.99,
    discount: '38%',
    rating: 4.3,
    reviews_count: 256,
    monthly_sales: '5K+ bought in past month',
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
    features: ['Active Noise Cancellation', '30-hour Battery Life', 'Bluetooth 5.0'],
    specifications: [
      { key: 'Brand', value: 'TechPro' },
      { key: 'Color', value: 'Matte Black' },
      { key: 'Weight', value: '250g' }
    ],
    variants: [],
    variant_options: [],
    comments: [
      { date: '2026-05-20', rating: 5, content: 'Excellent sound quality!', user_name: 'John D.' },
      { date: '2026-05-15', rating: 4, content: 'Good battery life, comfortable fit.', user_name: 'Sarah M.' }
    ]
  }
  // ... 更多商品
];
```

## 验证

生成后运行以下验证：
- `window.productData` 是数组且长度 >= 20
- 每条数据包含 id, name, brand, category, final_price
- `SDK.init()` 后 `SDK.count()` 正确
