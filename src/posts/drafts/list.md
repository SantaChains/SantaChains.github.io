---
title: list
slug: list
created: 2026-04-08T22:44
updated: 2026-04-09T14:08
draft: true
category: 随笔
tags: []
excerpt: ""
banner: images/sample.jpg
readingTime: true
---

# list

## 草稿文章 (draft: true)

```dataview
TABLE title, created, category
FROM "content"
WHERE draft = true
SORT created DESC
```

## 缺少Banner图片的文章

```dataview
TABLE title, created, category, banner
FROM "content"
WHERE banner = "images/" OR !banner
SORT created DESC
```

## Slug 包含中文或标点的文章

```dataview
TABLE title, slug, created
FROM "content"
WHERE regexmatch(slug, "[\u4e00-\u9fa5]") OR regexmatch(slug, "[^a-zA-Z0-9-_]")
SORT created DESC
```




