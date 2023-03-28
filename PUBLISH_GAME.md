# 发布游戏到 NESBox

添加游戏到 NESBox 前，请现在 NESBox 中搜索是否已经存在该游戏，
如果没有，请创建一个 [Github Issue](https://github.com/mantou132/nesbox/issues) 并提供以下信息：

- 游戏封面
- 游戏截图
- 游戏介绍
- ZIP 打包的游戏文件
- 游戏类型（Issue 标签）

游戏审核通过后（关闭 Issue）将出现在 NESBox 中。

## 为不同语言的用户提供游戏

NESBox 根据客户端语言设置为用户提供游戏，所以要为多个语言的用户提供游戏，则需要创建多个 Issue，
并且使用该语言提供上述信息。

## JavaScript 和 Rust 游戏

NESBox 不仅仅支持运行 NES 游戏，理论上它能支持任何满足 NESBox API 的游戏，NESBox 将在沙箱中运行他们，
你可以使用 [@mantou/ecs](https://www.npmjs.com/package/@mantou/ecs) 和 [nesbox_utils](https://crates.io/crates/nesbox_utils) 快速开发游戏，
Rust 游戏可以参考 [`五子棋 - MT`](./games/gomoku/)，JavaScript 游戏可以参考 [`俄罗斯方块 - MT`](./games/tetris/)，资源压缩使用 [NESBox Toolbox](https://nesbox-toolbox.vercel.app)。

在开发期间，只需要让你的游戏文件能被一个端口 `8000` 的 Web 服务被访问到，就可以在 NESBox 中快速预览你的游戏。

测试完毕后，将你的游戏构建成单文件 `.js` 或者 `.wasm`，然后打包成 ZIP 并通过 GitHub Issue 提交。
