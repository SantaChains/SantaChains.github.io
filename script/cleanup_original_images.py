#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
清理已转换为AVIF的原图片文件
功能：扫描images目录，删除已有对应AVIF文件的原始图片（jpg/png/webp等）
"""

import argparse
import sys
from pathlib import Path
from typing import List, Tuple


# 支持的原图片格式
SUPPORTED_ORIGINAL_EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.gif')


def find_deletable_pairs(images_dir: Path) -> List[Tuple[Path, Path]]:
    """
    查找可删除的原文件-AVIF对
    返回: [(原文件路径, 对应AVIF路径), ...]
    """
    pairs = []
    if not images_dir.exists():
        print(f"错误: 目录不存在 {images_dir}")
        return pairs

    for ext in SUPPORTED_ORIGINAL_EXTS:
        for original_file in images_dir.glob(f'*{ext}'):
            avif_file = original_file.with_suffix('.avif')
            if avif_file.exists():
                pairs.append((original_file, avif_file))

    return pairs


def cleanup_images(images_dir: Path, dry_run: bool = False) -> dict:
    """
    清理原图片文件

    入参:
        images_dir: 图片目录路径
        dry_run: 试运行模式（只显示不删除）

    出参:
        统计信息字典
    """
    stats = {
        'scanned': 0,
        'found_pairs': 0,
        'deleted': 0,
        'errors': 0,
        'space_saved': 0
    }

    print(f"{'='*60}")
    print("原图片清理工具")
    print(f"{'='*60}")
    print(f"扫描目录: {images_dir}")
    print(f"试运行模式: {dry_run}")
    print(f"{'='*60}\n")

    pairs = find_deletable_pairs(images_dir)
    stats['found_pairs'] = len(pairs)

    if not pairs:
        print("未发现可删除的原图片文件")
        return stats

    print(f"发现 {len(pairs)} 个可删除的原文件:\n")

    for i, (original, avif) in enumerate(pairs, 1):
        orig_size = original.stat().st_size
        avif_size = avif.stat().st_size

        print(f"[{i}/{len(pairs)}] {original.name}")
        print(f"  原文件: {orig_size/1024:.1f}KB")
        print(f"  AVIF:   {avif_size/1024:.1f}KB")

        if dry_run:
            print(f"  [试运行] 将删除: {original.name}\n")
            stats['space_saved'] += orig_size
        else:
            try:
                original.unlink()
                stats['deleted'] += 1
                stats['space_saved'] += orig_size
                print(f"  ✓ 已删除\n")
            except Exception as e:
                stats['errors'] += 1
                print(f"  ✗ 删除失败: {e}\n")

    # 输出统计
    print(f"{'='*60}")
    print("处理完成!")
    print(f"{'='*60}")
    print(f"发现可删除文件: {stats['found_pairs']}")
    print(f"成功删除: {stats['deleted']}")
    print(f"删除失败: {stats['errors']}")
    print(f"节省空间: {stats['space_saved']/1024/1024:.2f} MB")

    return stats


def main():
    parser = argparse.ArgumentParser(
        description='清理已转换为AVIF的原图片文件',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
使用示例:
  python cleanup_original_images.py                    # 默认扫描 src/posts/images
  python cleanup_original_images.py -i ./my_images     # 指定目录
  python cleanup_original_images.py -d                 # 试运行（不实际删除）
        '''
    )
    parser.add_argument(
        '-i', '--images-dir',
        default='src/posts/images',
        help='图片目录路径 (默认: src/posts/images)'
    )
    parser.add_argument(
        '-d', '--dry-run',
        action='store_true',
        help='试运行模式，只显示将要删除的文件而不实际删除'
    )

    args = parser.parse_args()

    images_dir = Path(args.images_dir)
    cleanup_images(images_dir, args.dry_run)


if __name__ == "__main__":
    main()
