#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
修复所有MD文件中的重复/错误frontmatter
策略：找到包含最多字段的frontmatter作为正确版本
"""

import re
from pathlib import Path

CONTENT_DIR = Path("src/posts/content")


def find_best_frontmatter(content: str) -> tuple:
    """找到最完整的frontmatter"""
    pattern = r'^---\s*\n(.*?)\n---\s*\n'
    matches = list(re.finditer(pattern, content, re.DOTALL))
    
    if not matches:
        return None, None
    
    # 选择包含最多字段的frontmatter
    best_match = max(matches, key=lambda m: len(m.group(1).split('\n')))
    return best_match.group(0), best_match.end()


def fix_md_file(md_file: Path) -> bool:
    """修复单个MD文件"""
    content = md_file.read_text(encoding='utf-8')
    
    best_fm, fm_end = find_best_frontmatter(content)
    if not best_fm:
        return False
    
    # 获取正文（从最佳frontmatter之后开始）
    body = content[fm_end:]
    
    # 清理正文中可能残留的frontmatter标记
    # 移除任何以 --- 开头的行（除了markdown分隔线上下文）
    lines = body.split('\n')
    cleaned_lines = []
    skip_next = False
    
    for i, line in enumerate(lines):
        if line.strip() == '---':
            # 检查这是否是frontmatter开始（后面跟着字段）
            if i + 1 < len(lines) and ':' in lines[i + 1]:
                skip_next = True
                continue
        if skip_next:
            if line.strip() == '---':
                skip_next = False
            continue
        cleaned_lines.append(line)
    
    body = '\n'.join(cleaned_lines)
    
    # 组合新内容
    new_content = best_fm + body
    
    if new_content != content:
        md_file.write_text(new_content, encoding='utf-8')
        return True
    return False


def main():
    content_dir = Path(CONTENT_DIR)
    md_files = list(content_dir.glob('*.md'))
    
    print('=' * 60)
    print('修复所有MD文件 Frontmatter')
    print('=' * 60)
    
    fixed_count = 0
    for md_file in md_files:
        try:
            if fix_md_file(md_file):
                print(f'✓ 已修复: {md_file.name}')
                fixed_count += 1
            else:
                print(f'  跳过: {md_file.name} (无需修复)')
        except Exception as e:
            print(f'✗ 错误: {md_file.name} - {e}')
    
    print('=' * 60)
    print(f'共修复 {fixed_count} 个文件')
    print('=' * 60)


if __name__ == "__main__":
    main()
