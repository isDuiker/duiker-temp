import { defineConfig } from "vitepress";
import { withSidebar } from "vitepress-sidebar";

// https://vitepress.dev/reference/site-config
export default defineConfig(
  withSidebar(
    {
      title: "FrontendDocs",
      description: "前端文档站",
      base: '/docs/',
      outDir: '../dist/docs',
      cleanUrls: true,
      srcDir: "src",
      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
          { text: "Home", link: "/" },
          { text: "Doc", link: "/JavaScript/字符串的特性" },
          { text: "MDN", link: "https://developer.mozilla.org/zh-CN/" },
        ],

        socialLinks: [{ icon: "github", link: "https://github.com/isDuiker" }],

        footer: {
          message: `<a href="https://beian.miit.gov.cn/" target="_blank">鄂ICP备20041652号-2</a>`,
          copyright: `版权所有 © 2019-${new Date().getFullYear()} duiker`,
        },

        docFooter: {
          prev: "上一页",
          next: "下一页",
        },

        // https://vitepress.dev/zh/reference/default-theme-config#outline
        outline: {
          level: [2, 3],
          label: "页面导航",
        },

        lastUpdated: {
          text: "最后更新于",
          formatOptions: {
            dateStyle: "short", // full
            timeStyle: "short", // medium
          },
        },

        langMenuLabel: "多语言",
        returnToTopLabel: "回到顶部",
        sidebarMenuLabel: "菜单",
        darkModeSwitchLabel: "主题",
        lightModeSwitchTitle: "切换到浅色模式",
        darkModeSwitchTitle: "切换到深色模式",
      },
    },
    {
      documentRootPath: "/docs/src",
      // 根据每个文章的标题(不是文件名)来生成目录
      useTitleFromFileHeading: false,
      // 根据每篇 Markdown 的 order 排序
      sortMenusByFrontmatterOrder: true,
      // 没写 order 的文章放后面
      frontmatterOrderDefaultValue: 999,
      // 排序完成后隐藏编号
      removePrefixAfterOrdering: true,
      // 去掉 URL 中的编号
      removePrefixFromLink: true,
      // 同时识别 01-、01_、01. 等前缀
      prefixSeparator: /^\d+[-_.]/,
      collapsed: false,
    },
  ),
);
