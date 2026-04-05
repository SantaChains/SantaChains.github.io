---
title: "《<% tp.system.prompt('请输入书名') %>》读书笔记"
slug: "book-<% tp.file.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') %>"
created: "<% tp.date.now('YYYY-MM-DDTHH:mm') %>"
updated: "<% tp.date.now('YYYY-MM-DDTHH:mm') %>"
draft: false
category: "读书笔记"
tags: ["读书笔记", "<% tp.system.prompt('请输入书籍分类，如：文学, 技术, 历史') %>"]
excerpt: "<% tp.system.prompt('请输入一句话总结这本书') %>"
banner: "images/"
readingTime: true
---

# 《<% tp.system.prompt('请输入书名') %>》

**作者**：<% tp.system.prompt('请输入作者') %>  
**出版社**：<% tp.system.prompt('请输入出版社') %>  
**阅读时间**：<% tp.system.prompt('请输入阅读时间，如：2024年12月') %>  
**评分**：<% tp.system.suggester(['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'], [1, 2, 3, 4, 5]) %>/5

![书籍封面](images/book-cover.jpg)

## 核心观点

<% tp.file.cursor() %>

## 关键摘录

> 摘录内容

## 个人思考

## 行动计划

## 相关笔记

---
**创建时间**：<% tp.date.now('YYYY年MM月DD日 HH:mm') %>
**更新时间**：<% tp.date.now('YYYY年MM月DD日 HH:mm') %>
