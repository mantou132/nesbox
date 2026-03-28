# CLAUDE.md

此文件为 Claude Code 提供使用此存储库中的代码时的指导。

## 项目介绍

这是一个 Monorepo，包含 WebApp，WebServer，Flutter App，还有自带的几个游戏，
目录请参考[这里](./CONTRIBUTING.md)。

### 命令

命令在包里面声明了，一般通过 `--cwd` 指定位置执行命令：`yarn --cwd packages/webapp start`。
Rust 项目通过进入目录后运行。

## 构架

### 核心组建
- **前端**: 使用 TypeScript 和 Gem(https://gemjs.org)
- **后端**: 使用 Rust 和 GraphQL API Juniper
- **数据库**: 数据库 ORM 使用 Diesel

### TypeScript 规则

- 新代码风格应该和已有代码风格保持一致
- 使用较新的 Web API 或者 ES 标准，永远使用简单的代码来实现功能

### 基于 Gem 的 WebApp

一般 `elements` 文件夹下的文件用来编写 Gem 元素，`modules` 文件夹是业务相关的 Gem 元素，一个文件包含一个或多个元素，文件名是元素名的无前缀版，Gem 元素扩展自 GemElement 或者 GemElement 的派生类。

#### Gem 语法

下面是一个 Gem 元素的例子，里面的注释解释了 Gem 的语法或者 API，
请认真阅读下面的例子和注释，编写 Gem 元素时请严格遵守下面的规则。

```ts
// 如果需要全局状态，就可以创建一个 Store
// 也许是从其他模块中导入的
const store = createStore({
  globalCount: 1,
  text: '',
});

// 一个更新 Store 的函数，Store 即是个数据对象，也可以用来更新内容
// 一般和 Store 的定义写在模块中，也可能没有这样的函数，因为可以直接调用 `store({})` 更新
const addCount = () => store({ globalCount: store.globalCount + 1 });

// 创建一个给元素实例用的主题
// 当元素的样式基于元素的属性时使用这种方法
// 这是个特殊的主题，在应用到元素时他也是个装饰器，作用是用来反应元素属性的变化来更改主题值
const elementTheme = createDecoratorTheme({ color: 'red' });

// 用 `css` 创建 Gem 元素可挂载的样式表，可以使用 CSS 嵌套语法
// 只有元素通过 `@shadow` 定义成了 Shadow DOM，CSS 中才能使用 `:host`
// 否则使用 `:scope`，请注意区分它们的使用方法而不是简单的替换
// 不要在模板内写内联样式，以这种方式定义的样式可以共享，而且和 DOM 分离
// 如果项目定义了主题，CSS 规则值可以从主题读取
const style = css`
  :scope {
    display: block;
    color: ${theme.textColor};
  }
`;

// 复杂的元素，可以使用这个方案编写样式表，在模板中用 `style1.header` 来引用类名
const style1 = css({
  // `$` 表示 `:host` 或 `:scope`
  $: styled`
    font-size: small;
  `,
  content: styled`
    font-size: 24px;
    color: ${elementTheme.color};
  `,
});

// 自定义元素标签名，使用统一的 `dy` 命名空间
@customElement('dy-test')
// 将创建的样式表挂载到元素上，使用多次就可以挂载多个样式表
@adoptedStyle(style)
@adoptedStyle(style1)
// 将全局 store 链接到元素上，store 更新时驱动元素更新，使用多次就可以链接多个 store
@connectStore(store)
// 默认是 Light DOM，只有使用了 `@shadow()` 才是 Shadow DOM，参数是 `ShadowRootInit`
@shadow()
// 一般不需要使用，只有该元素的内容需要能被外部样式化时才使用
@light({ penetrable: true })
// 指定元素渲染不会阻塞主线程，如果这个元素需要一次渲染很多个实例，可以使用
@async()
// 用来指定元素的 ARIA 属性，加强元素的可访问性
@aria({ role: 'region' })
// 这里的元素类名，`Duoyun` 是 `dy` 的全称，后面要加 `Element`，类似原生 HTML 元素类名
class DuoyunTestElement extends GemElement {
  // 定义元素的 part，使用静态字段可以让外部引用 part 名称，不需要设置初始值，状态器会提供一个同名初始值
  static @part img: string;
  // 定义元素的 slot，和 `@part` 一样的原则
  static @slot content: string;
  // 指定一个称为 `src` 的 Attribute，当没有赋值时默认解析成空字符串
  @attribute src: string;
  // 指定一个称为 `count` 的 Attribute，但解析成数字，当没有赋值时默认解析成 `0`
  @numattribute count: number;
  // 指定一个称为 `show` 的 Attribute，但解析成布尔值，当没有赋值时默认解析成 `false`
  @boolattribute show: boolean;
  // 当 Attribute 不能表示的属性时用 Property 表示，由于用户可以不传递属性，所以总要处理为空的情况，更改时会触发元素重新渲染
  @property data?: {};
  // 定义了一个 `display-content` 事件，直接调用触发，参数是自定义事件的 `detail` 属性
  // 只需要指定类型，类型中的参数是自定义事件的 `detail` 属性，`this.displayContent(true)` 触发
  // 很多时候传递数据，就使用 `null` 占位
  // `@globalemitter` 可以穿透 ShadowDOM 进行冒泡
  @emitter displayContent: Emitter<boolean>;
  // 定义 CSS 状态，仅仅是用来供外部 CSS 选择器使用，例如 `dy-test:state(open)`
  // 修改方法：`this.open = true`，没有特别的限制
  @state open: boolean;

  // 创建一个 { value?: HTMLImageElement } 对象，用来访问 DOM
  #imgRef = createRef<HTMLImageElement>();
  // 创建一个内部状态对象，`this.#state({ ... })` 来更新状态
  // 元素内部不应该更新元素的 Attribute/Property，就像原生元素一样
  // 注意和 CSS 状态 `@state` 无关
  #state = createState({ internalCount: 1 });

  // Attribute 不要赋初始值，因为 DOM 序列化会多出以内容，如果需要默认值，可以定义一个 `getter`
  // Property 可以赋初始值，但也可以同样用 `getter`
  get #src() {
    return this.src || 'test';
  }
  
  // 一些复杂计算可以使用 `@memo`，他的参数是一个函数，参数是当前实例，返回一个依赖数组
  // 在元素每次渲染前执行，只有依赖数组有更改时才会执行函数内容
  // 基于 `@memo` 实现了 `@willMount`
  @memo((i) => [i.src])
  get #text() {
    return i.src.repeat(10);
  }

  // 每次渲染后的副作用，参数和 `@memo` 一样，没有参数时每次都执行
  // 返回的函数会作为清理函数，在下次调用前执行
  // 类似 React 的 `useLayoutEffect`
  // 基于 `@effect` 实现了 `@mounted` `@unmounted`
  @effect()
  #print = () => {
    console.log('updated');
    return () => console.log('clear');
  }

  // `@template` 指定模板渲染函数，参数是一个条件函数，可以为不同条件指定不同渲染内容
  // 不提供条件函数时直接认为满足条件
  @template()
  #content = () => {
    const imgProps = { dataTest: 1 };
    // 模板语法基于 lit-html，添加了 Vue 的 `v-if` 语法、Ref 语法和剩余属性语法
    // 必要时候使用 `classMap` `styleMap` `partMap` `exportPartsMap`
    return html`
      <img ${this.#imgRef} ${imgProps} src=${this.#src} part=${DuoyunTestElement.part} />
      <div class=${classMap({ div: true })} v-if=${this.show}>Show</div>
      <div v-else class=${style1.content} style=${styleMap({ fontSize: '10px' })}>None</div>
    `;
  }

  // 当元素更新后，会根据依赖是否变化重新计算主题，不提供依赖函数则每次更新都更新主题
  @elementTheme((self) => [self.show])
  #updateTheme = () => ({ color: this.show ? 'red' : 'blue' });

  // 渲染出错时的后备内容，只有可能会渲染出错时才需要提供后备模板内容
  @fallback()
  #errorContent = (err) => {
    return html`Error: ${err}`;
  }

  // Gem 元素使用 ES 装饰器定义特性，装饰器本身就完整的表示了意义，所以不需要额外写自定义元素声明
  // Gem 元素不要使用生命周期函数，应该使用各种装饰器装饰普通函数，生命周期已经弃用了!!!
  // 应该尽量使用 ES 私有字段（`#aaa`）来替代类方法，这样没有 `this` 指向的问题
}

```

#### Gem 最佳实践

- 最截实践 [001-create-standard-element.md](mdc:packages/gem/docs/en/004-blog/001-create-standard-element.md)
