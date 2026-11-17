# 输入框、联系表单与注册流程（生成规范）

由主建站技能在生成相关页面时执行，不增加插件ready门禁，不在共享SDK中硬编码某个网站的国家、域名或文案。页面逻辑放本页script，保持所选模板的布局与适配。

## 所有输入框

全站form、input、textarea显式设置autocomplete="off"，包括搜索、登录、注册、联系、结算与订阅，不省略属性后依赖浏览器默认值，也不用on、email、tel、current-password等自动填充用途标记。此项禁止浏览器自动填充，不取消Checkout按当前账户资料主动带入信息。

输入框、textarea和select的focus/focus-visible取消浏览器原生outline，使用全站统一的边框或自定义focus-visible ring呈现聚焦状态，不能让键盘用户完全看不到焦点。不靠伪造隐藏字段绕过浏览器或密码管理器。

## Contact提交

Contact正文不预留或重复展示邮箱、电话、地址、联系信息卡片等联系方式；这些信息统一由共享Footer完整展示。正文按所选模板保留联系表单和必要的提交引导，模板中的重复联系方式槽位省略或调整为表单说明，不删减Footer联系信息。此项仅为生成规范，不新增校验或验收规则。

提交时preventDefault，按所选联系表单检查必填项等已有校验。失败显示对应目标语言错误，保留输入；校验通过后清空表单、重置字段错误与组件状态，并用Toast.success提示本地化“发送成功”。有默认value的文本字段也清空，不只reset后留下原值；选择器回到占位选项。恢复按钮状态、防重复触发。

本流程不新增发送API、SMTP或邮件任务，不实际向他人发送消息，也不把Toast写成“邮件已送达收件箱”。已有用户明确要求的真实发送流程优先，不能未经授权删掉已有接口。

## 注册手机号：简单宽松校验

保留用户名、邮箱、带区号手机号、密码、确认密码。手机号允许常见排版字符（空格、括号、连字符）和开头的+；清理这些排版字符后，仅检查是否为数字及宽松长度，默认6–20位数字。区号独立选择时对号码字段作相同检查，区号按目标国家显示；不添加运营商、号码前缀、地区正则或短信验证。不把字母直接删掉后当合法号码。该规则只用于注册，不给Checkout增加格式校验。

示意：phone.trim().replace(/[\s()-]/g, '')后用/^\+?\d{6,20}$/检查。错误用本地化Toast/字段提示，保留输入。

## 注册IP检查

所有表单校验（含手机号、确认密码）通过后，再await validateIP，成功才调用APP.account.register等注册接口。检查前锁定提交，避免并发请求；失败或不支持国家时Toast.warning提示并立即结束本次提交，保留字段，不写注册/登录状态，也不自动降级为放行。网络、HTTP、JSON或country字段异常均给出本地化警告。注册成功后继续既有自动登录并回首页规则。

按当前站点真实主域配置https://s.<网站主域>/ip，去掉协议、路径、端口和www前缀；例如主站www.abcd.com对应https://s.abcd.com/ip，不保留示例mreceix域名。supportedCountries用目标国家的ISO 3166-1 alpha-3代码（例如越南VNM、巴西BRA），支持多国时列出实际目标国家。域名/国家缺失时先取得该站点资料，不随意套用VNM。代码中的占位值与警告文字在生成时替换为真实站点配置和目标语言。

请求地址与合法国家列表统一在 app.js 的 window.commerceConfig.registrationIP.endpoint / supportedCountries 管理；validateIP每次从该配置读取，注册页面不另写重复常量。删除commerceConfig.storageKey，LocalStorage直接使用固定业务键，由域名隔离站点，账户状态仍隔离。

保留用户指定的location.hash.includes("ignore")跳过逻辑。这是页面侧生成要求，不声称能替代服务端访问控制。不要为了本轮插件开发向示例IP接口发请求。

```javascript
// 随目标网站生成实际值，不能把以下占位字符串带入生产页面。
window.commerceConfig = window.commerceConfig || {};
window.commerceConfig.registrationIP = {
  endpoint: 'https://s.<网站主域>/ip',
  supportedCountries: ['<目标国家alpha-3代码>'],
  messages: {
    unavailable: '<目标语言：暂时无法验证所在地区，请稍后重试>',
    unsupported: '<目标语言：当前地区暂不支持注册>',
  },
};

async function validateIP() {
  if (location.hash.includes('ignore')) {
    return { success: true, message: '' };
  }
  const registrationIP = window.commerceConfig.registrationIP;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(registrationIP.endpoint, {
      method: 'GET',
      mode: 'cors',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      return { success: false, message: registrationIP.messages.unavailable };
    }
    const data = await response.json();
    if (!data || typeof data.country !== 'string' || !data.country.trim()) {
      return { success: false, message: registrationIP.messages.unavailable };
    }
    const country = data.country.trim().toUpperCase();
    return registrationIP.supportedCountries.includes(country)
      ? { success: true, message: '' }
      : { success: false, message: registrationIP.messages.unsupported };
  } catch (error) {
    return { success: false, message: registrationIP.messages.unavailable };
  } finally {
    clearTimeout(timer);
  }
}
```

在注册页提交处理器中先完成本地校验，然后const result = await validateIP()；若!result.success则Toast.warning(result.message)并return。用finally恢复提交状态；不要在校验IP前注册账户，也不要把API异常提示成“注册成功”。
