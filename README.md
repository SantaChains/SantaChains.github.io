# SantaChains - 川端康成风格的个人博客

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.4.4-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-3.4-cyan?style=flat-square&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

<p align="center">
  一个充满日本文学美学的个人博客，以川端康成的雪国为灵感，融合了现代Web技术与传统东方美学。
</p>

<p align="center">
  <a href="https://santachains.github.io/santachains-blog/" target="_blank">🌸 在线预览</a>
</p>

---

## ✨ 特色功能

### 🌸 视觉美学
- **川端康成风格**：整体色调采用樱花粉与雾蓝色的渐变，营造雪国的朦胧美感
- **动态樱花飘落**：实时生成的樱花花瓣动画，营造诗意的氛围
- **水波纹效果**：点击页面产生涟漪，增添互动趣味
- **文字渐变**：使用CSS渐变动画，让文字如雪花般闪烁
- **深色模式**：优雅的暗色主题，保护眼睛的同时保持美感

### 🎭 交互体验
- **3D磁吸卡片**：鼠标移动时卡片跟随倾斜，增强沉浸感
- **打字机效果**：副标题逐字显示，带闪烁光标
- **模糊玻璃效果**：使用backdrop-filter实现现代毛玻璃质感
- **平滑过渡**：所有交互都有精心设计的动画过渡
- **响应式设计**：完美适配桌面、平板和移动设备

### 📝 内容展示
- **Markdown渲染**：支持完整的Markdown语法，包括表格、代码块等
- **目录导航**：自动提取文章标题，支持平滑滚动定位
- **首字下沉**：文章首字采用特殊字体，增添文学气息
- **图片懒加载**：优化性能的同时保持流畅体验

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| **Next.js 15.4.4** | React框架，支持App Router |
| **TypeScript** | 类型安全的JavaScript |
| **Tailwind CSS** | 实用优先的CSS框架 |
| **shadcn/ui** | 精美的React组件库 |
| **Framer Motion** | 流畅的动画效果 |
| **Canvas API** | 高性能粒子系统 |

---

## 🎨 设计哲学

> "美在于发现，在于邂逅，是机缘。" - 川端康成

本项目试图通过数字媒介，捕捉川端康成笔下那种稍纵即逝的美。每一个像素、每一行代码，都是对"物哀"美学的现代诠释。

### 色彩语言

| 颜色 | 色值 | 寓意 |
|------|------|------|
| 🌸 **樱花粉** | `#F8BBD9` | 代表生命的脆弱与美丽 |
| 🌫️ **雾蓝色** | `#B8C5D6` | 象征雪国的宁静与深远 |
| 📜 **宣纸白** | `#FEFEFE` | 承载文字的纯净背景 |

### 动效理念
- **樱花飘落**：象征时间的流逝与生命的短暂
- **水波涟漪**：表现内心的波动与情感的扩散
- **文字闪烁**：如同雪花在月光下的反射

---

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/SantaChains/santachains-blog

# 进入项目目录
cd santachains-blog

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看效果。

### 构建生产版本

```bash
npm run build
```

构建输出位于 `dist` 目录。

---

## 📁 项目结构

```
santachains-blog/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React组件
│   │   ├── effects/      # 视觉效果组件
│   │   ├── layout/       # 布局组件
│   │   ├── post/         # 文章相关组件
│   │   └── ui/           # UI组件库
│   ├── content/          # Markdown文章
│   ├── hooks/            # 自定义Hooks
│   ├── lib/              # 工具函数
│   └── types/            # TypeScript类型
├── public/               # 静态资源
│   └── fonts/            # 字体文件
└── .github/workflows/    # CI/CD配置
```

---

## 📱 响应式展示

- **桌面端**：三列网格布局，充分展示内容
- **平板端**：双列布局，保持阅读体验
- **移动端**：单列布局，优化触摸交互

---

## 🎨 字体资源

本项目使用了以下中文字体：

| 字体 | 文件 | 用途 |
|------|------|------|
| **有字库龙藏体** | `Arima-Regular.ttf` | 标题和正文 |
| **文泉微米黑** | `WenQuanWeiMiHei.ttf` | 正文内容 |
| **仓耳今楷03** | `CangErJinKai03.ttf` | 首字下沉 |

---

## 🙏 致谢

### 开源项目
- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Lucide Icons](https://lucide.dev/) - 图标库

### 灵感来源
- 川端康成《雪国》- 虚无美学
- 三岛由纪夫《金阁寺》- 极致之美
- [chenglou/pretext](https://github.com/chenglou/pretext) - 排版灵感

### 字体资源
- [有字库](https://www.youziku.com/) - 龙藏体
- [文泉驿](http://wenq.org/) - 微米黑
- [仓耳字库](https://www.tsanger.cn/) - 今楷

---

## 📄 许可证

[MIT](LICENSE) © SantaChains

---

<p align="center">
  <i>在雪国的寂静中，用文字捕捉那些稍纵即逝的美丽瞬间。</i>
</p>

<p align="center">
  Made with 💗 by SantaChains
</p>
