# 欢迎来到贡献手册

感谢您投入时间为 NESBox 做出贡献！您所做的任何贡献都将永久在 NESBox 留下足迹。

## 不编写代码

- 优化 NESBox 的[翻译](https://github.com/mantou132/nesbox/tree/master/packages/webapp/src/locales)
- 进行更好的 UI/UX 设计（[原型 1](https://www.figma.com/file/N6DxApZl41524ey9fVL6LF/NESBox?node-id=0%3A1)、[原型 2](https://www.figma.com/file/XSQ8Pc5s1SBpbyqDUFzdZe/NESBox-Flutter?node-id=0%3A1)）
- 完善游戏的截图、介绍等信息（点击游戏详情页面中的编辑按钮）

## 贡献代码

想要贡献代码，请先了解 NESBox 项目。

### NESBox 技术栈：

- 前端使用 [gemjs](https://github.com/mantou132/gem)，它基于 WebComponents，大量使用 TypeScript 装饰器和 ES Classes 语法进行开发，可以参考[文档](https://gemjs.org/en/guide/basic/reactive-element#life-cycle)
- 后端使用 [Juniper](https://docs.rs/juniper/latest/juniper/index.html) 构建 GraphQL 服务
- 数据库 ORM 使用 [Diesel](https://diesel.rs/)

![](https://cdn-images.postach.io/300e62d3-c3ba-45f5-a14e-8abaf49d8e67/04f5e711-c258-48ec-81ce-3fb80bfe523e/3531c750-fb91-442a-b9ea-824b176788c3.png)

### 目录结构

```
packages
├── config            共享配置
├── flutter_app       NESBox 的 Android/iOS App
├── mt-app            用于 NESBox 和 flutter_app 后端交互
├── nes               游戏模拟器的 WASM 接口，实现这个接口的任何模拟器都能在 NESBox 上运行
├── nes-pkg           从 `nes` 构建自动生成的 ES 模块
├── server            NESBox GraphQL API
│   ├── migrations    数据库 SQL
│   └── src
│       ├── auth.rs     用户认证
│       ├── db          DB 连接和 Model 定义
│       ├── error.rs    自定义错误
│       ├── github.rs   通过 Github Issue 管理 NESBox 游戏
│       ├── handles.rs  Actix-web 路由处理
│       ├── main.rs
│       ├── schemas     数据库 CURD
│       └── voice       游戏语音服务
├── tauriapp            NESBox 桌面端
│   ├── src
│   │   ├── handler.rs    用于 Web 端调用的接口，比如设置徽标
│   │   ├── main.rs
│   │   ├── preload.rs    注入 js
│   │   └── window_ext.rs 窗口自定义
│   └─ ...
├── webapp                    Web 端、桌面端、Android/iOS 端都使用此包
│   ├── src
│   │   ├── app.ts            NESBox Web 端根元素
│   │   ├── auth.ts
│   │   ├── configure.ts
│   │   ├── constants.ts
│   │   ├── drop.ts           接收用户拖放的 `.nes` 文件
│   │   ├── elements          和 NESBox 业务无关的自定义元素
│   │   ├── gamepad.ts        手柄监听和模拟
│   │   ├── generated         GraphQL 自动生成的代码
│   │   ├── help-i18n.ts
│   │   ├── homepage-i18n.ts
│   │   ├── i18n.ts
│   │   ├── icons.ts          NESBox Web 端使用的图标集，使用 Material Icons
│   │   ├── images
│   │   ├── index.html
│   │   ├── index.ts
│   │   ├── locales           各模块语言包
│   │   ├── logger.ts
│   │   ├── modules           和 NESBox 数据相关的自定义元素
│   │   ├── mt-app.ts         NESBox Android/iOS 端根元素
│   │   ├── pages
│   │   ├── routes.ts
│   │   ├── rtc.ts            游戏连接 WebRTC 连接
│   │   ├── services          GraphQL APIs
│   │   ├── store.ts          用户的 NESBox 数据，会储存在 LocalStorage
│   │   ├── theme.ts
│   │   ├── tour-i18n.ts
│   │   ├── tours.ts          新手游戏指引
│   │   ├── types
│   │   └── utils.ts
│   └─ ...
└── zombie 网上爬取数据和下载图片用到的脚本
```

### 本地开发

准备环境（都是可选，取决于要对那部分进行开发调试）：

- Node
- Rust
- Flutter

拉取代码：

```
git clone --recurse-submodules https://github.com/mantou132/nesbox.git
```

#### 调试 API

查看 [README](packages/server/README.md)

#### 调试 Web

```bash
yarn
yarn --cwd packages/webapp start
```

#### 调试 Tauri

查看 [README](packages/tauriapp/README.md)

#### 调试 Flutter

查看 [README](packages/flutter_app/README.md)

#### 调试 NES 模拟器

```
cargo watch -w packages/nes -w deps/tetanes -s "yarn run build:nes"
```

对您感兴趣的地方进行改进，然后提交 PR，感谢您的贡献。
