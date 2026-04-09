#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
修复MD文件中banner路径分隔符
将反斜杠 \ 替换为正斜杠 /
"""

import re
from pathlib import Path

CONTENT_DIR = Path("src/posts/content")


def fix_banner_paths_in_file(md_file: Path):
    """修复单个MD文件中的banner路径"""
    content = md_file.read_text(encoding='utf-8')

    # 匹配 banner: "path\to\image.avif" 或 banner: path\to\image.avif
    pattern = r'(banner:\s*["\']?)(.+?)(["\']?\s*$)'

    def replace_backslash(match):
        prefix = match.group(1)
        path = match.group(2)
        suffix = match.group(3)
        # 将反斜杠替换为正斜杠
        fixed_path = path.replace('\\', '/')
        return f'{prefix}{fixed_path}{suffix}'

    new_content = re.sub(pattern, replace_backslash, content, flags=re.MULTILINE)

    if new_content != content:
        md_file.write_text(new_content, encoding='utf-8')
        return True
    return False


def main():
    content_dir = Path(CONTENT_DIR)
    md_files = list(content_dir.glob('*.md'))

    fixed_count = 0
    for md_file in md_files:
        if fix_banner_paths_in_file(md_file):
            print(f"✓ 已修复: {md_file.name}")
            fixed_count += 1

    print(f"\n共修复 {fixed_count} 个文件")


if __name__ == "__main__":
    main()
