# scss进阶技巧

## 1、控制指令

### @if

当 `@if` 的表达式返回值不是 `false` 或者 `null` 时，条件成立，输出 `{}` 内的代码；`@if` 声明后面可以跟多个 `@else if` 声明，或者一个 `@else` 声明。

```scss
$type: monster;
p {
  @if $type == ocean {
    color: blue;
  } @else if $type == matador {
    color: red;
  } @else if $type == monster {
    color: green;
  } @else {
    color: black;
  }
}
```

编译为

```scss
p {
  color: green;
}
```

### @for

> `@for` 指令可以在限制的范围内重复输出格式，每次按要求（变量的值）对输出结果做出变动。这个指令包含两种格式：`@for $var from <start> through <end>`，或者 `@for $var from <start> to <end>`，区别在于 `through` 与 `to` 的含义：*当使用 `through` 时，条件范围包含 `<start>` 与 `<end>` 的值，而使用 `to` 时条件范围只包含 `<start>` 的值不包含 `<end>` 的值*。另外，`$var` 可以是任何变量，比如 `$i`；`<start>` 和 `<end>` 必须是整数值。

```scss
@for $i from 1 through 3 {
  .item-#{$i} { width: 2em * $i; }
}
```

编译为

```scss
.item-1 {
  width: 2em;
}
.item-2 {
  width: 4em;
}
.item-3 {
  width: 6em;
}
```

### @each

`@each` 指令的格式是 `$var in <list>`, `$var` 可以是任何变量名，比如 `$length` 或者 `$name`，而 `<list>` 是一连串的值，也就是值列表。

`@each` 将变量 `$var` 作用于值列表中的每一个项目，然后输出结果，例如：

```scss
@each $animal in puma, sea-slug, egret, salamander {
  .#{$animal}-icon {
    background-image: url('/images/#{$animal}.png');
  }
}
```

编译为

```scss
.puma-icon {
  background-image: url('/images/puma.png'); }
.sea-slug-icon {
  background-image: url('/images/sea-slug.png'); }
.egret-icon {
  background-image: url('/images/egret.png'); }
.salamander-icon {
  background-image: url('/images/salamander.png'); }
```

由于`each`被视为由成对元素组成的列表，因此多重赋值在处理地图时也同样适用。例如：

```scss
@each $header, $size in (h1: 2em, h2: 1.5em, h3: 1.2em) {
  #{$header} {
    font-size: $size;
  }
}
```

编译为

```scss
h1 {
  font-size: 2em; }
h2 {
  font-size: 1.5em; }
h3 {
  font-size: 1.2em; }
```

### @while

`@while` 指令重复输出格式直到表达式返回结果为 `false`。这样可以实现比 `@for` 更复杂的循环，只是很少会用到。

```scss
$i: 6;
@while $i > 0 {
  .item-#{$i} { width: 2em * $i; }
  $i: $i - 2;
}
```

编译为

```scss
.item-6 {
  width: 12em; }

.item-4 {
  width: 8em; }

.item-2 {
  width: 4em; }
```

## 2、Map(映射)函数

Sass Map(映射)对象是以一对或多对的 key/value 来表示。

Sass Map 是不可变的，因此在处理 Map 对象时，返回的是一个新的 Map 对象，而不是在原有的 Map 对象上进行修改。

### map-get

> map-get(*map*, *key*)。返回 Map 中 *key* 所对应的 value(值)。如没有对应的 key，则返回 null 值。
>

```scss
$font-sizes: ("small": 12px, "normal": 18px, "large": 24px);
.text{
	font-size: map-get($font-sizes, "small")  // 结果: 12px
}
```

### map-has-key

> 判断 *map* 是否有对应的 *key*，存在返回 true，否则返回 false。

```scss
$font-sizes: ("small": 12px, "normal": 18px, "large": 24px);
.text{
    @if map-has-key($font-sizes, "big"){
		font-size: map-get($font-sizes, "big")
    } @else if map-has-key($font-sizes, "large"){
    	font-size: map-get($font-sizes, "large")
    } @else{
        font-size: map-get($font-sizes, "small")
    }
}
结果: font-size: 24px
```

### map-keys

> 返回 *map* 中所有的 key 组成的队列。

```scss
$font-sizes: ("small": 12px, "normal": 18px, "large": 24px);
map-keys($font-sizes)
结果: "small", "normal, "large"	
```

### map-values

> 返回 *map* 中所有的 value 并生成一个队列。

```scss
$font-sizes: ("small": 12px, "normal": 18px, "large": 24px)
map-values($font-sizes)
结果: 12px, 18px, 24px
```

### map-merge

> 合并两个 map 形成一个新的 map 类型，即将 *map2* 添加到 *map1*的尾部

```scss
$font-sizes: ("small": 12px, "normal": 18px, "large": 24px)
$font-sizes2: ("x-large": 30px, "xx-large": 36px)
map-merge($font-sizes, $font-sizes2)
结果: "small": 12px, "normal": 18px, "large": 24px, "x-large": 30px, "xx-large": 36px
```

### map-remove

>  移除 *map* 中的 keys，多个 key 使用逗号隔开。
>

```scss
$font-sizes: ("small": 12px, "normal": 18px, "large": 24px)
map-remove($font-sizes, "small")
结果: ("normal": 18px, "large": 24px)
map-remove($font-sizes, "small", "large")
结果: ("normal": 18px)
```

### 注意

> 从 **Dart Sass 1.80.0** 开始，所有全局内置函数（如 `map-get()`、`map-has-key()`、`map-merge()`等）都被标记为弃用，并计划在未来的 3.0.0 版本中移除 。Sass 官方推荐使用模块系统（通过 `@use`规则导入模块）来调用这些函数，例如使用 `map.get()`替代全局的 `map-get()`函数

修改前：

```scss
$font-sizes: ("small": 12px, "normal": 18px, "large": 24px);

.text {
  // 使用全局函数 map-has-key 和 map-get
  @if map-has-key($font-sizes, "big") {
    font-size: map-get($font-sizes, "big");
  }
}
```

修改后：

```scss
@use "sass:map"; // 引入 map 模块

$font-sizes: ("small": 12px, "normal": 18px, "large": 24px);

.text {
  // 使用模块函数 map.has-key 和 map.get
  @if map.has-key($font-sizes, "big") {
    font-size: map.get($font-sizes, "big");
  }
}
```

## 3、导入导出新语法

### 导入@use

> `@import`规则已经被弃用，需要在未来 Dart Sass 3.0.0 版本发布前将其替换为新的模块系统（`@use`或 `@forward`）

下面这个表格能帮你快速理解新旧语法的核心区别以及如何修改。

| 特性对比           | `@import`(已弃用)                                            | `@use`(推荐替代)                                             | 修改方法示例                                                 |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **作用域**         | **全局**。所有变量、混合宏和函数在导入后变为全局可访问，容易造成命名冲突。 | **模块化**。通过命名空间访问成员，有效隔离，避免污染。       | 将 `@import "./components/index.scss";`改为 `@use "./components/index.scss";` |
| **成员访问**       | 直接使用。例如：`$color-blue`。                              | 通过**命名空间**访问。默认命名空间是文件名（去掉了下划线和扩展名）。 | 如果文件名为 `_index.scss`，命名空间默认为 `index`。访问变量需写为 `index.$variable-name`。 |
| **编译性能**       | 同一文件多次导入会被多次编译，导致输出冗余和速度变慢。       | 同一模块只编译一次，效率更高。                               | -                                                            |
| **自定义命名空间** | 不支持。                                                     | 支持，使用 `as`关键字。                                      | @use "./components/index.scss" as comps;，之后通过 comps.$variable-name访问。 |

**使用自定义命名空间**（更推荐，更清晰）：

```scss
@use './components/index.scss' as comps; // 定义别名

.my-class {
  color: comps.$primary-color; // 通过别名访问
}
```

### 导出(转发)@forward

> 在 `theme.scss`中，使用 `@forward`规则将其他文件中的混合宏（mixin）和变量“转发”出去，这样在 `App.vue`中通过 `@use`引入 `theme.scss`时才能使用这些成员

```scss
// theme.scss
// 转发变量文件
@forward './_variables.scss';
// 转发混合宏文件（确保 theme-bg 混入在此文件中定义）
@forward './_mixins.scss';
// 转发组件样式索引文件
@forward './components/index.scss';
```

























