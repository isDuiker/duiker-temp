# scss入门基础

## 1、变量

### 变量声明

```scss
$highlight-color: #FF9900;
```

### 变量引用

```scss
$highlight-color: #FF9900; //变量声明
.selected {
  border: 1px solid $highlight-color;
}

//编译后的代码
.selected {
  border: 1px solid #FF9900;
}
```

## 2、父选择器的标识符&

这种在CSS中的写法

```css
.content{
    font-size: 18px;
}
.content .content-body {
    color: red;
}
.content .content-body:hover{
    color: skyblue;
}
```

在scss可以写成如下格式

```scss
.content{
    font-size: 18px;
    &-body{
        color: red;
        &:hover { color: skyblue }
    }
}
```

## 3、导入scss文件

css

> `css`有一个特别不常用的特性，即`@import`规则，它允许在一个`css`文件中导入其他`css`文件。然而，后果是只有执行到`@import`时，浏览器才会去下载其他`css`文件，这导致页面加载起来特别慢。

scss

> `scss`也有一个`@import`规则，但不同的是，`scss`的`@import`规则在生成`css`文件时就把相关文件导入进来。这意味着所有相关的样式被归纳到了同一个`css`文件中，而无需发起额外的下载请求。

通常，有些`scss`文件用于导入，你并不希望为每个这样的文件单独地生成一个`css`文件。对此，`scss`用一个特殊的约定来解决。

> 此约定即，`scss`局部文件的文件名以下划线开头。这样，`scss`就不会在编译时单独编译这个文件输出`css`，而只把这个文件用作导入。
>
> 当你`@import`一个局部文件时，还可以不写文件的全名，即省略文件名开头的下划线。举例来说，你想导入`themes/_night-sky.scss`这个局部文件里的变量，你只需在样式表中写`@import` `"themes/night-sky";`。

### 默认变量值

一般情况下，你反复声明一个变量，只有最后一处声明有效且它会覆盖前边的值

```scss
$link-color: blue;
$link-color: red;
a {
	color: $link-color; // red
}
```

在上边的例子中，超链接的`color`会被设置为`red`。这可能并不是你想要的结果，假如你写了一个可被他人通过`@import`导入的`scss`库文件，你可能希望导入者可以定制修改`scss`库文件中的某些值。使用`scss`的`!default`标签可以实现这个目的。它很像`css`属性中`!important`标签的对立面，不同的是`!default`用于变量，含义是：如果这个变量被声明赋值了，那就用它声明的值，否则就用这个默认值。

```scss
$fancybox-width: 400px !default;
.fancybox {
	width: $fancybox-width;
}
```

在上例中，如果用户在导入你的`scss`局部文件之前声明了一个`$fancybox-width`变量，那么你的局部文件中对`$fancybox-width`赋值`400px`的操作就无效。如果用户没有做这样的声明，则`$fancybox-width`将默认为`400px`。

### 嵌套导入

`scss`允许`@import`命令写在`css`规则内。这种导入方式下，生成对应的`css`文件时，局部文件会被直接插入到`css`规则内导入它的地方

```scss
// _blue-theme.scss
aside {
  background: blue;
  color: white;
}
```

然后把它导入到一个CSS规则内

```scss
.blue-theme {@import "blue-theme"}
```

生成的结果为

```scss
// 生成的结果跟你直接在.blue-theme选择器内写_blue-theme.scss文件的内容完全一样。
.blue-theme {
  aside {
    background: blue;
    color: #fff;
  }
}
```

## 4、混合器

### 使用混合器

> 如果你的整个网站中有几处小小的样式类似（例如一致的颜色和字体），那么使用变量来统一处理这种情况是非常不错的选择。但是当你的样式变得越来越复杂，你需要大段大段的重用样式的代码，独立的变量就没办法应付这种情况了。你可以通过`scss`的混合器实现大段样式的重用。

下边的这段`scss`代码，定义了一个非常简单的混合器，目的是通过flex布局实现居中。

```scss
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

然后就可以在你的样式表中通过`@include`来使用这个混合器，放在你希望的任何地方。`@include`调用会把混合器中的所有样式提取出来放在`@include`被调用的地方。如果像下边这样写：

```scss
.notice {
  background-color: green;
  border: 2px solid #00aa00;
  @include flex-center;
}

//scss最终生成：
```

```scss
.notice {
  background-color: green;
  border: 2px solid #00aa00;
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### 混合器中的CSS规则

混合器中不仅可以包含属性，也可以包含`css`规则，包含选择器和选择器中的属性

```scss
@mixin no-bullets {
  list-style: none;
  li {
    list-style-image: none;
    list-style-type: none;
    margin-left: 0px;
  }
}
```

当一个包含`css`规则的混合器通过`@include`包含在一个父规则中时，在混合器中的规则最终会生成父规则中的嵌套规则。

```scss
ul.plain {
  color: #444;
  @include no-bullets;
}
```

`scss`的`@include`指令会将引入混合器的那行代码替换成混合器里边的内容。最终，上边的例子如下代码:

```scss
ul.plain {
  color: #444;
  list-style: none;
}
ul.plain li {
  list-style-image: none;
  list-style-type: none;
  margin-left: 0px;
}
```

### 给混合器传参

给混合器传参跟`JavaScript`的`function`很像

```scss
@mixin link-colors($normal, $hover, $visited) {
  color: $normal;
  &:hover { color: $hover; }
  &:visited { color: $visited; }
}
```

当混合器被`@include`时，你可以把它当作一个`css`函数来传参。如果你像下边这样写：

```scss
a {
  @include link-colors(blue, red, green);
}

//scss最终生成的是：

a { color: blue; }
a:hover { color: red; }
a:visited { color: green; }
```

当你@include混合器时，有时候可能会很难区分每个参数是什么意思，参数之间是一个什么样的顺序。为了解决这个问题，`scss`允许通过语法`$name: value`的形式指定每个参数的值。这种形式的传参，参数顺序就不必再在乎了，只需要保证没有漏掉参数即可：

```scss
a {
    @include link-colors(
      $normal: blue,
      $visited: green,
      $hover: red
  );
}
```

### 默认参数值

为了在`@include`混合器时不必传入所有的参数，我们可以给参数指定一个默认值。参数默认值使用`$name: default-value`的声明形式，默认值可以是任何有效的`css`属性值，甚至是其他参数的引用。

```scss
@mixin link-colors(
    $normal,
    $hover: $normal,
    $visited: $normal
  )
{
  color: $normal;
  &:hover { color: $hover; }
  &:visited { color: $visited; }
}
```

如果这样调用：`@include link-colors(red)` ，`$hover`和`$visited`也会被自动赋值为`red`。

## 5、选择器继承

一个选择器可以继承为另一个选择器定义的所有样式。通过`@extend`语法实现

```scss
//通过选择器继承继承样式
.error {
  border: 1px solid red;
  background-color: #fdd;
}
.seriousError {
  @extend .error;
  border-width: 3px;
}
```

在上边的代码中，`.seriousError`将会继承样式表中任何位置处为`.error`定义的所有样式。以`class="seriousError"` 修饰的`html`元素最终的展示效果就好像是`class="seriousError error"`。相关元素不仅会拥有一个`3px`宽的边框，而且这个边框将变成红色的，这个元素同时还会有一个浅红色的背景，因为这些都是在`.error`里边定义的样式。

`.seriousError`不仅会继承`.error`自身的所有样式，任何跟`.error`有关的组合选择器样式也会被`.seriousError`以组合选择器的形式继承，如下代码:

```scss
//.seriousError从.error继承样式
.error a{  //应用到.seriousError a
  color: red;
  font-weight: 100;
}
h1.error { //应用到hl.seriousError
  font-size: 1.2rem;
}
```

如上所示，在`class="seriousError"`的`html`元素内的超链接也会变成红色和粗体。

### 何时使用继承

当一个元素拥有的类（比如说`.seriousError`）表明它属于另一个类（比如说`.error`），这时使用继承再合适不过了。

这有点抽象，所以我们从几个方面来阐释一下。想象一下你正在编写一个页面，给`html`元素添加类名，你发现你的某个类（比如说`.seriousError`）另一个类（比如说`.error`）的细化。你会怎么做？

- 你可以为这两个类分别写相同的样式，但是如果有大量的重复怎么办？使用`scss`时，我们提倡的就是不要做重复的工作。
- 你可以使用一个选择器组（比如说`.error``.seriousError`）给这两个选择器写相同的样式。如果.error的所有样式都在同一个地方，这种做法很好，但是如果是分散在样式表的不同地方呢？再这样做就困难多了。
- 你可以使用一个混合器为这两个类提供相同的样式，但当`.error`的样式修饰遍布样式表中各处时，这种做法面临着跟使用选择器组一样的问题。这两个类也不是恰好有相同的 样式。你应该更清晰地表达这种关系。
- 综上所述你应该使用`@extend`。让`.seriousError`从`.error`继承样式，使两者之间的关系非常清晰。更重要的是无论你在样式表的哪里使用`.error``.seriousError`都会继承其中的样式。

### 继承的高级用法

大多数情况你可能只想对类使用继承，但是有些场合你可能想做得更多。最常用的一种高级用法是继承一个`html`元素的样式。尽管默认的浏览器样式不会被继承，因为它们不属于样式表中的样式，但是你对`html`元素添加的所有样式都会被继承。

接下来的这段代码定义了一个名为`disabled`的类，样式修饰使它看上去像一个灰掉的超链接。通过继承a这一超链接元素来实现：

```scss
.disabled {
  color: gray;
  @extend a;
}
```

### 细节

假如一条样式规则继承了一个复杂的选择器，那么它只会继承这个复杂选择器命中的元素所应用的样式。举例来说， 如果`.seriousError``@extend``.important.error` ， 那么`.important.error` 和`h1.important.error` 的样式都会被`.seriousError`继承， 但是`.important`或者`.error下`的样式则不会被继承。这种情况下你很可能希望`.seriousError`能够分别继承`.important`或者`.error`下的样式。

如果一个选择器序列（`#main .seriousError`）`@extend`另一个选择器（`.error`），那么只有完全匹配`#main .seriousError`这个选择器的元素才会继承`.error`的样式，就像单个类 名继承那样。拥有`class="seriousError"`的`#main`元素之外的元素不会受到影响。

像`#main .error`这种选择器序列是不能被继承的。这是因为从`#main .error`中继承的样式一般情况下会跟直接从`.error`中继承的样式基本一致，细微的区别往往使人迷惑。

`@extend`背后最基本的想法是，如果`.seriousError @extend .error`， 那么样式表中的任何一处`.error`都用`.error``.seriousError`这一选择器组进行替换。这就意味着相关样式会如预期那样应用到`.error`和`.seriousError`。当`.error`出现在复杂的选择器中，比如说`h1.error``.error a`或者`#main .sidebar input.error[type="text"]`，那情况就变得复杂多了，但是不用担心，`scss`已经为你考虑到了这些。

关于`@extend`有两个要点你应该知道。

- 跟混合器相比，继承生成的`css`代码相对更少。因为继承仅仅是重复选择器，而不会重复属性，所以使用继承往往比混合器生成的`css`体积更小。如果你非常关心你站点的速度，请牢记这一点。
- 继承遵从`css`层叠的规则。当两个不同的`css`规则应用到同一个`html`元素上时，并且这两个不同的`css`规则对同一属性的修饰存在不同的值，`css`层叠规则会决定应用哪个样式。相当直观：通常权重更高的选择器胜出，如果权重相同，定义在后边的规则胜出。

混合器本身不会引起`css`层叠的问题，因为混合器把样式直接放到了`css`规则中，而继承存在样式层叠的问题。被继承的样式会保持原有定义位置和选择器权重不变。通常来说这并不会引起什么问题，但是知道这点总没有坏处。

### 使用继承的最佳实践

通常使用继承会让你的`css`美观、整洁。因为继承只会在生成`css`时复制选择器，而不会复制大段的`css`属性。但是如果你不小心，可能会让生成的`css`中包含大量的选择器复制。

避免这种情况出现的最好方法就是不要在`css`规则中使用后代选择器（比如`.foo .bar`）去继承`css`规则。如果你这么做，同时被继承的`css`规则有通过后代选择器修饰的样式，生成`css`中的选择器的数量很快就会失控：

```scss
.foo .bar { @extend .baz; }
.bip .baz { a: b; }
```

在上边的例子中，`scss`必须保证应用到.baz的样式同时也要应用到`.foo .bar`（位于class="foo"的元素内的class="bar"的元素）。例子中有一条应用到`.bip .baz`（位于class="bip"的元素内的class="baz"的元素）的`css`规则。当这条规则应用到`.foo .bar`时，可能存在三种情况，如下代码:

```scss
<!-- 继承可能迅速变复杂 -->
<!-- Case 1 -->
<div class="foo">
  <div class="bip">
    <div class="bar">...</div>
  </div>
</div>
<!-- Case 2 -->
<div class="bip">
  <div class="foo">
    <div class="bar">...</div>
  </div>
</div>
<!-- Case 3 -->
<div class="foo bip">
  <div class="bar">...</div>
</div>
```

为了应付这些情况，`scss`必须生成三种选择器组合（仅仅是.bip .foo .bar不能覆盖所有情况）。如果任何一条规则里边的后代选择器再长一点，`scss`需要考虑的情况就会更多。实际上`scss`并不总是会生成所有可能的选择器组合，即使是这样，选择器的个数依然可能会变得相当大，所以如果允许，尽可能避免这种用法。

值得一提的是，只要你想，你完全可以放心地继承有后代选择器修饰规则的选择器，不管后代选择器多长，但有一个前提就是，不要用后代选择器去继承。

## 小结

本文介绍了`scss`最基本部分,你可以轻松地使用`scss`编写清晰、无冗余、语义化的`css`。对于`scss`提供的工具你已经有了一个比较深入的了解，同时也掌握了何时使用这些工具的指导原则。

变量是`scss`提供的最基本的工具。通过变量可以让独立的`css`值变得可重用，无论是在一条单独的规则范围内还是在整个样式表中。变量、混合器的命名甚至`scss`的文件名，可以互换通用`_`和`-`。同样基础的是`scss`的嵌套机制。嵌套允许`css`规则内嵌套`css`规则，减少重复编写常用的选择器，同时让样式表的结构一眼望去更加清晰。`scss`同时提供了特殊的父选择器标识符`&`，通过它可以构造出更高效的嵌套。

你也已经学到了`scss`的另一个重要特性，样式导入。通过样式导入可以把分散在多个`scss`文件中的内容合并生成到一个`css`文件，避免了项目中有大量的`css`文件通过原生的`css` `@import`带来的性能问题。通过嵌套导入和默认变量值，导入可以构建更强有力的、可定制的样式。混合器允许用户编写语义化样式的同时避免视觉层面上样式的重复。你不仅学到了如何使用混合器减少重复，同时学习到了如何使用混合器让你的`css`变得更加可维护和语义化。最后，我们学习了与混合器相辅相成的选择器继承。继承允许你声明类之间语义化的关系，通过这些关系可以保持你的`css`的整洁和可维护性。

























