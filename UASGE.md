# 使用指南

> **作者**：SantaChains  
> **项目**：川端康成风格的个人博客

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/SantaChains/santachains-blog.git
cd santachains-blog
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看效果。

---

## Obsidian 配置

### 打开仓库

在 Obsidian 中选择打开文件夹：
```
项目路径/src/posts
```

### 推荐插件

| 插件                                 | 用途             | 说明                                   |
|--------------------------------------|------------------|----------------------------------------|
| **Templater**                        | 文章模板自动化   | 创建文章模板，自动填充 YAML 前置数据   |
| **Dataview**                         | 文章列表查询     | 查询草稿、统计文章、管理内容           |
| **Banners**                          | 文章封面图       | 为笔记添加 banner 封面图片             |
| **Auto Link Title**                  | 链接标题自动获取 | 粘贴链接时自动获取网页标题             |
| **Update time on edit**              | 自动更新时间     | 编辑时自动更新 YAML 中的 updated 字段  |
| **BRAT**                             | 测试版插件安装   | 安装插件的 beta 版本进行测试           |
| **Tag Wrangler**                     | 标签管理         | 批量管理标签，重命名、合并等           |
| **Consistent attachments and links** | 附件链接一致性   | 自动移动附件并更新链接，保持库的一致性 |



## BRAT加载的插件

- [按属性自动化](https://github.com/SantaChains/obsidian-auto-plus)
- [albus-imagine](https://github.com/AlbusGuo/albus-imagine) - 图片管理插件
- [obsidian-generate-timeline](https://github.com/Shanshuimei/obsidian-generate-timeline) - 时间线生成 (可选)

## obsidian skill链接

- [obsidian-skills](https://github.com/kepano/obsidian-skills) - Obsidian 技能集合

### 模板使用

1. 安装 Templater 插件
2. 设置模板文件夹：`src/posts/templates/`
3. 新建文章时选择模板

---

## 写作工作流

### 创建文章

**YAML 前置数据格式：**

```yaml
---
title: "文章标题"
slug: "article-slug"
created: "2026-04-08T21:31"
updated: "2026-04-08T21:31"
draft: false
category: "随笔"
tags: ["标签1", "标签2"]
excerpt: "文章摘要"
banner: "images/cover.jpg"
readingTime: true
---
```

### 图片管理

- 图片存放：`src/posts/images/`
- 引用方式：`![描述](images/your-image.jpg)`
- 构建时自动复制到 public 目录

---

## 常用命令

| 命令                  | 说明           |
|-----------------------|----------------|
| `npm run dev`         | 启动开发服务器 |
| `npm run build`       | 构建生产版本   |
| `npm run verify`      | 验证文章完整性 |
| `npm run copy-images` | 复制图片资源   |

---

## 部署到 GitHub Pages

1. 修改 `next.config.ts` 中的 `assetPrefix` 为你的仓库名
2. 推送代码到 GitHub
3. GitHub Actions 自动部署

---

## 目录结构

```
src/posts/
├── content/      # 发布的文章
├── drafts/       # 草稿
├── images/       # 文章配图
└── templates/    # 文章模板
```

---

## 特色功能

- 🌸 **樱花动画**：首页自动播放
- 🌙 **深色模式**：右上角切换
- 📝 **代码高亮**：支持 100+ 语言
- 📐 **数学公式**：KaTeX 支持
- 📑 **目录导航**：自动生成

---

## 注意事项

1. **slug 规范**：建议使用英文、数字、连字符
2. **图片路径**：使用相对路径 `images/xxx.jpg`
3. **YAML 格式**：注意缩进和引号
4. **构建前**：运行 `npm run verify` 检查

---

## 故障排查

| 问题       | 解决                  |
|------------|-----------------------|
| 图片不显示 | 检查路径是否正确      |
| 文章不加载 | 检查 YAML 格式        |
| 构建失败   | 运行 `npm run verify` |
| 样式异常   | 检查 Tailwind 类名    |

---

## 技术栈

- Next.js 15.4.4
- TypeScript 5.x
- Tailwind CSS 4.x
- shadcn/ui
- Framer Motion

---

**更多信息请参考 README.md**
