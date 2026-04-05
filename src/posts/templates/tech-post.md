---
title: "<% tp.file.title %>"
slug: "<% tp.file.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') %>"
created: "<% tp.date.now('YYYY-MM-DDTHH:mm') %>"
updated: "<% tp.date.now('YYYY-MM-DDTHH:mm') %>"
draft: false
category: "技术"
tags: ["<% tp.system.prompt('请输入技术标签，如：React, Next.js, Node.js') %>"]
excerpt: "<% tp.system.prompt('请输入文章摘要') %>"
banner: "images/"
readingTime: true
---

# <% tp.file.title %>

## 背景

<% tp.file.cursor() %>

## 解决方案

### 代码示例

```typescript
// 你的代码
```

## 总结

## 参考链接

---
**创建时间**：<% tp.date.now('YYYY年MM月DD日 HH:mm') %>
**更新时间**：<% tp.date.now('YYYY年MM月DD日 HH:mm') %>
