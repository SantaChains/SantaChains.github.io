---
title: "<% tp.file.title %>"
slug: "<% tp.file.title.toLowerCase().replace(/\s+/g, '-') %>"
created: "<% tp.date.now('YYYY-MM-DDTHH:mm') %>"
updated: "<% tp.date.now('YYYY-MM-DDTHH:mm') %>"
draft: false
category: "<% tp.system.suggester(['随笔', '技术', '读书笔记', '生活'], ['随笔', '技术', '读书笔记', '生活']) %>"
tags: []
excerpt: ""
banner: "images/"
readingTime: true
---

# <% tp.file.title %>

<% tp.file.cursor() %>

## 图片示例

![图片描述](images/example.jpg)

## 结语

---
**创建时间**：<% tp.date.now('YYYY年MM月DD日 HH:mm') %>
**更新时间**：<% tp.date.now('YYYY年MM月DD日 HH:mm') %>
