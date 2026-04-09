#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
修复MD文件中重复的YAML frontmatter
只保留第一个有效的frontmatter块
"""

import re
from pathlib import Path

CONTENT_DIR = Path("src/posts/content")


def fix_duplicate_frontmatter(md_file: Path) -> bool:
    """修复单个MD文件中的重复frontmatter"""
    content = md_file.read_text(encoding='utf-8')
    
    # 查找所有 frontmatter 块
    pattern = r'^---\s*\n(.*?)\n---\s*\n'
    matches = list(re.finditer(pattern, content, re.DOTALL))
    
    if len(matches) <= 1:
        return False  # 没有重复
    
    # 只保留第一个frontmatter，其余作为正文
    first_fm = matches[0]
    first_fm_end = first_fm.end()
    
    # 获取第一个frontmatter内容
    new_frontmatter = first_fm.group(0)
    
    # 剩余内容（跳过所有frontmatter块）
    remaining_content = content[first_fm_end:]
    
    # 清理剩余内容中可能残留的frontmatter标记
    # 如果正文以 --- 开头，移除它
    remaining_content = re.sub(r'^---\s*\n', '', remaining_content)
    
    # 组合新内容
    new_content = new_frontmatter + remaining_content
    
    md_file.write_text(new_content, encoding='utf-8')
    return True


def main():
    content_dir = Path(CONTENT_DIR)
    md_files = list(content_dir.glob('*.md'))
    
    print('=' * 60)
    print('修复重复 Frontmatter')
    print('=' * 60)
    
    fixed_count = 0
    for md_file in md_files:
        if fix_duplicate_frontmatter(md_file):
            print(f'✓ 已修复: {md_file.name}')
            fixed_count += 1
    
    print('=' * 60)
    print(f'共修复 {fixed_count} 个文件')
    print('=' * 60)


if __name__ == "__main__":
    main()
