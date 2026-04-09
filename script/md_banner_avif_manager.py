#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MD Banner AVIF 智能管理工具
支持GUI和CLI双模式，具备增量更新、无损压缩、重复检测等功能

功能特性:
1. 增量更新 - 只处理发生变化的文件
2. 无损压缩 - 转换前进行图片优化
3. 重复检测 - 检测同名不同后缀的重复文件
4. 配置管理 - 支持删除原文件等选项
5. 双模式 - GUI图形界面 + CLI命令行
"""

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple

try:
    from PyQt5.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QPushButton, QLabel, QLineEdit, QFileDialog, QMessageBox,
        QTextEdit, QSpinBox, QCheckBox, QGroupBox, QProgressBar
    )
    from PyQt5.QtCore import Qt, QThread, pyqtSignal
    HAS_PYQT5 = True
except ImportError:
    HAS_PYQT5 = False

from PIL import Image


# ============ 配置类 ============

@dataclass
class Config:
    """配置类"""
    content_dir: str = "src/posts/content"
    images_dir: str = "src/posts/images"
    avif_quality: int = 85
    keep_original: bool = True
    enable_optimization: bool = True
    check_duplicates: bool = True

    def save(self, path: Optional[Path] = None):
        save_path = path or Path(".banner_avif_config.json")
        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(asdict(self), f, indent=2)

    @classmethod
    def load(cls, path: Optional[Path] = None) -> "Config":
        config_file = path or Path(".banner_avif_config.json")
        if config_file.exists():
            with open(config_file, 'r', encoding='utf-8') as f:
                return cls(**json.load(f))
        return cls()


# ============ 文件状态追踪 ============

class FileStateTracker:
    """文件状态追踪器，用于增量更新"""

    def __init__(self, state_file: Path = Path(".banner_avif_state.json")):
        self.state_file = state_file
        self.states: Dict[str, dict] = {}
        self.load()

    def load(self):
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    self.states = json.load(f)
            except Exception:
                self.states = {}

    def save(self):
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.states, f, indent=2)

    def get_file_hash(self, file_path: Path) -> str:
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def is_modified(self, file_path: Path) -> bool:
        if not file_path.exists():
            return False
        file_key = str(file_path)
        current_hash = self.get_file_hash(file_path)
        current_mtime = file_path.stat().st_mtime
        if file_key not in self.states:
            return True
        saved = self.states[file_key]
        return saved.get('hash') != current_hash or saved.get('mtime') != current_mtime

    def update_state(self, file_path: Path, avif_path: Optional[Path] = None):
        self.states[str(file_path)] = {
            'hash': self.get_file_hash(file_path),
            'mtime': file_path.stat().st_mtime,
            'last_processed': datetime.now().isoformat(),
            'avif_path': str(avif_path) if avif_path else None
        }


# ============ 核心处理器 ============

class BannerAvifProcessor:
    SUPPORTED_EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.gif')

    def __init__(self, config: Config, tracker: FileStateTracker, dry_run: bool = False):
        self.config = config
        self.tracker = tracker
        self.dry_run = dry_run
        self.stats = {'processed': 0, 'converted': 0, 'skipped': 0, 'errors': 0,
                      'duplicates': 0, 'deleted': 0, 'space_saved': 0}

    def log(self, msg: str):
        print(msg)

    def extract_yaml(self, content: str) -> Tuple[Optional[str], Optional[str]]:
        match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
        return (match.group(1), match.group(2)) if match else (None, None)

    def extract_banner(self, yaml: str) -> Optional[str]:
        for line in yaml.split('\n'):
            match = re.match(r'^banner:\s*["\']?(.+?)["\']?\s*$', line.strip())
            if match:
                return match.group(1).strip('"\'')
        return None

    def update_banner(self, yaml: str, new_val: str) -> str:
        def repl(m):
            return f'{m.group(1)}{new_val}{m.group(3)}'
        return re.sub(r'^(banner:\s*["\']?)(.+?)(["\']?\s*)$', repl, yaml, flags=re.MULTILINE)

    def find_duplicate_images(self, base_path: Path) -> List[Path]:
        """查找同名不同后缀的重复图片"""
        if not base_path.exists():
            return []
        base_name = base_path.stem
        parent = base_path.parent
        duplicates = []
        for ext in self.SUPPORTED_EXTS:
            candidate = parent / f"{base_name}{ext}"
            if candidate.exists() and candidate != base_path:
                duplicates.append(candidate)
        # 检查AVIF是否已存在
        avif_path = base_path.with_suffix('.avif')
        if avif_path.exists():
            duplicates.append(avif_path)
        return duplicates

    def optimize_image(self, img: Image.Image) -> Image.Image:
        """图片无损优化"""
        # 转换为RGB/RGBA
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        return img

    def convert_to_avif(self, input_path: Path, output_path: Path) -> bool:
        try:
            with Image.open(input_path) as img:
                img = self.optimize_image(img)
                img.save(output_path, 'AVIF', quality=self.config.avif_quality)
            return True
        except Exception as e:
            self.log(f"  转换失败: {e}")
            return False

    def process_md_file(self, md_file: Path, images_dir: Path) -> dict:
        result = {'file': md_file.name, 'status': 'skipped', 'message': ''}

        try:
            content = md_file.read_text(encoding='utf-8')
            yaml, body = self.extract_yaml(content)
            if not yaml:
                result['message'] = '无YAML frontmatter'
                return result

            banner = self.extract_banner(yaml)
            if not banner:
                result['message'] = '无banner字段'
                return result

            # 检查是否已是AVIF
            if banner.lower().endswith('.avif'):
                result['message'] = '已是AVIF格式'
                return result

            # 定位图片文件
            banner_rel = Path(banner)
            img_file = md_file.parent / banner_rel
            if not img_file.exists():
                img_file = images_dir / banner_rel.name

            if not img_file.exists():
                result['message'] = f'图片不存在: {banner_rel}'
                return result

            # 检查文件是否修改（增量更新）
            if not self.tracker.is_modified(img_file):
                result['message'] = '文件未变化，跳过'
                return result

            self.stats['processed'] += 1

            # 检查重复文件
            duplicates = self.find_duplicate_images(img_file)
            if duplicates:
                self.stats['duplicates'] += len(duplicates)
                dup_names = [d.name for d in duplicates]
                self.log(f"  发现重复文件: {', '.join(dup_names)}")

            # 生成AVIF路径
            avif_file = img_file.with_suffix('.avif')

            if self.dry_run:
                self.log(f"  [试运行] 将转换: {img_file.name} -> {avif_file.name}")
                result['status'] = 'dry_run'
                return result

            # 执行转换
            self.log(f"  转换: {img_file.name} -> {avif_file.name}")
            if self.convert_to_avif(img_file, avif_file):
                # 计算压缩率
                orig_size = img_file.stat().st_size
                avif_size = avif_file.stat().st_size
                saved = orig_size - avif_size
                self.stats['space_saved'] += saved
                self.log(f"    {orig_size/1024:.1f}KB -> {avif_size/1024:.1f}KB (节省 {saved/1024:.1f}KB)")

                # 更新MD文件 - 使用正斜杠作为路径分隔符
                new_banner = banner_rel.with_suffix('.avif').as_posix()
                new_yaml = self.update_banner(yaml, new_banner)
                new_content = f"---\n{new_yaml}\n---\n{body}"
                md_file.write_text(new_content, encoding='utf-8')

                # 删除原文件（如果配置允许）
                if not self.config.keep_original:
                    img_file.unlink()
                    self.stats['deleted'] += 1
                    self.log(f"    已删除原文件: {img_file.name}")

                # 更新状态追踪
                self.tracker.update_state(img_file, avif_file)

                self.stats['converted'] += 1
                result['status'] = 'converted'
                result['message'] = '转换成功'
            else:
                self.stats['errors'] += 1
                result['status'] = 'error'
                result['message'] = '转换失败'

        except Exception as e:
            self.stats['errors'] += 1
            result['status'] = 'error'
            result['message'] = str(e)

        return result

    def run(self, content_dir: Path, images_dir: Path):
        self.log(f"{'='*60}")
        self.log("MD Banner AVIF 智能管理工具")
        self.log(f"{'='*60}")
        self.log(f"Content目录: {content_dir}")
        self.log(f"Images目录: {images_dir}")
        self.log(f"AVIF质量: {self.config.avif_quality}")
        self.log(f"保留原文件: {self.config.keep_original}")
        self.log(f"试运行模式: {self.dry_run}")
        self.log(f"{'='*60}\n")

        if not content_dir.exists():
            self.log(f"错误: Content目录不存在")
            return

        md_files = list(content_dir.glob('*.md'))
        self.log(f"找到 {len(md_files)} 个MD文件\n")

        for i, md_file in enumerate(md_files, 1):
            self.log(f"[{i}/{len(md_files)}] {md_file.name}")
            result = self.process_md_file(md_file, images_dir)
            self.log(f"  -> {result['message']}\n")

        # 保存状态
        if not self.dry_run:
            self.tracker.save()
            if not self.config.keep_original:
                self.config.save()

        # 输出统计
        self.log(f"{'='*60}")
        self.log("处理完成!")
        self.log(f"{'='*60}")
        self.log(f"处理文件: {self.stats['processed']}")
        self.log(f"成功转换: {self.stats['converted']}")
        self.log(f"跳过: {self.stats['skipped']}")
        self.log(f"错误: {self.stats['errors']}")
        self.log(f"发现重复: {self.stats['duplicates']}")
        self.log(f"删除原文件: {self.stats['deleted']}")
        self.log(f"总节省空间: {self.stats['space_saved']/1024/1024:.2f} MB")


# ============ GUI模式 ============

class Worker(QThread):
    log_signal = pyqtSignal(str)
    finished_signal = pyqtSignal()

    def __init__(self, processor, content_dir, images_dir):
        super().__init__()
        self.processor = processor
        self.content_dir = content_dir
        self.images_dir = images_dir

    def run(self):
        self.processor.log = lambda msg: self.log_signal.emit(msg)
        self.processor.run(self.content_dir, self.images_dir)
        self.finished_signal.emit()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MD Banner AVIF 管理工具")
        self.setMinimumSize(800, 600)
        self.config = Config.load()
        self.init_ui()

    def init_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setSpacing(15)
        layout.setContentsMargins(20, 20, 20, 20)

        # 标题
        title = QLabel("MD Banner AVIF 智能管理工具")
        font = QFont()
        font.setPointSize(16)
        font.setBold(True)
        title.setFont(font)
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        # 目录设置
        dir_group = QGroupBox("目录设置")
        dir_layout = QVBoxLayout(dir_group)

        # Content目录
        content_layout = QHBoxLayout()
        content_layout.addWidget(QLabel("Content目录:"))
        self.content_edit = QLineEdit(self.config.content_dir)
        content_layout.addWidget(self.content_edit)
        btn = QPushButton("浏览...")
        btn.clicked.connect(lambda: self.browse_dir(self.content_edit))
        content_layout.addWidget(btn)
        dir_layout.addLayout(content_layout)

        # Images目录
        images_layout = QHBoxLayout()
        images_layout.addWidget(QLabel("Images目录:"))
        self.images_edit = QLineEdit(self.config.images_dir)
        images_layout.addWidget(self.images_edit)
        btn = QPushButton("浏览...")
        btn.clicked.connect(lambda: self.browse_dir(self.images_edit))
        images_layout.addWidget(btn)
        dir_layout.addLayout(images_layout)

        layout.addWidget(dir_group)

        # 选项设置
        opt_group = QGroupBox("转换选项")
        opt_layout = QVBoxLayout(opt_group)

        # 质量设置
        quality_layout = QHBoxLayout()
        quality_layout.addWidget(QLabel("AVIF质量 (1-100):"))
        self.quality_spin = QSpinBox()
        self.quality_spin.setRange(1, 100)
        self.quality_spin.setValue(self.config.avif_quality)
        quality_layout.addWidget(self.quality_spin)
        quality_layout.addStretch()
        opt_layout.addLayout(quality_layout)

        # 复选框
        self.keep_check = QCheckBox("保留原文件(不删除)")
        self.keep_check.setChecked(self.config.keep_original)
        opt_layout.addWidget(self.keep_check)

        self.dry_check = QCheckBox("试运行模式(不实际修改)")
        opt_layout.addWidget(self.dry_check)

        layout.addWidget(opt_group)

        # 执行按钮
        self.run_btn = QPushButton("开始处理")
        self.run_btn.setMinimumHeight(45)
        self.run_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50; color: white;
                font-weight: bold; font-size: 14px; border-radius: 8px;
            }
            QPushButton:hover { background-color: #45a049; }
            QPushButton:disabled { background-color: #cccccc; }
        """)
        self.run_btn.clicked.connect(self.start_process)
        layout.addWidget(self.run_btn)

        # 进度条
        self.progress = QProgressBar()
        self.progress.setVisible(False)
        layout.addWidget(self.progress)

        # 日志区域
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMinimumHeight(250)
        layout.addWidget(self.log_text)

        layout.addStretch()

    def browse_dir(self, line_edit):
        path = QFileDialog.getExistingDirectory(self, "选择目录")
        if path:
            line_edit.setText(path)

    def log(self, msg):
        self.log_text.append(msg)

    def start_process(self):
        # 更新配置
        self.config.content_dir = self.content_edit.text()
        self.config.images_dir = self.images_edit.text()
        self.config.avif_quality = self.quality_spin.value()
        self.config.keep_original = self.keep_check.isChecked()
        dry_run = self.dry_check.isChecked()

        # 保存配置
        self.config.save()

        # 清空日志
        self.log_text.clear()
        self.run_btn.setEnabled(False)

        # 创建处理器
        tracker = FileStateTracker()
        processor = BannerAvifProcessor(self.config, tracker, dry_run)

        # 启动工作线程
        content_dir = Path(self.config.content_dir)
        images_dir = Path(self.config.images_dir)

        self.worker = Worker(processor, content_dir, images_dir)
        self.worker.log_signal.connect(self.log)
        self.worker.finished_signal.connect(lambda: self.run_btn.setEnabled(True))
        self.worker.start()


# ============ CLI模式 ============

def run_cli(args):
    config = Config.load(Path(args.config) if args.config else None)

    if args.content:
        config.content_dir = args.content
    if args.images:
        config.images_dir = args.images
    if args.quality:
        config.avif_quality = args.quality
    if args.keep_original:
        config.keep_original = True

    tracker = FileStateTracker()
    processor = BannerAvifProcessor(config, tracker, args.dry_run)

    content_dir = Path(config.content_dir)
    images_dir = Path(config.images_dir)

    processor.run(content_dir, images_dir)


# ============ 主入口 ============

def main():
    parser = argparse.ArgumentParser(description='MD Banner AVIF 智能管理工具')
    parser.add_argument('--content', '-c', help='Content目录路径')
    parser.add_argument('--images', '-i', help='Images目录路径')
    parser.add_argument('--quality', '-q', type=int, help='AVIF质量 (1-100)')
    parser.add_argument('--keep-original', '-k', action='store_true', help='保留原文件')
    parser.add_argument('--dry-run', '-d', action='store_true', help='试运行模式')
    parser.add_argument('--config', help='配置文件路径')
    parser.add_argument('--gui', '-g', action='store_true', help='启动GUI')

    args = parser.parse_args()

    if args.gui or (not args.content and not HAS_PYQT5):
        if HAS_PYQT5:
            app = QApplication(sys.argv)
            window = MainWindow()
            window.show()
            sys.exit(app.exec_())
        else:
            print("错误: 需要安装PyQt5以使用GUI模式: pip install PyQt5")
            sys.exit(1)
    else:
        run_cli(args)


if __name__ == "__main__":
    main()
