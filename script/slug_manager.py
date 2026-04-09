#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
MD文件Slug管理工具
支持GUI文件选择器和CLI参数两种模式

功能:
1. 提取MD文件YAML中的slug字段
2. 导出TSV表格供AI处理
3. 从TSV导入新slug并更新MD文件

入参:
    --input PATH    输入文件或目录(相对/绝对路径)
    --tsv PATH      TSV文件路径(用于导入模式)
    --output PATH   输出TSV文件路径(默认: slugs.tsv)
    --gui           强制使用GUI模式

出参:
    控制台输出操作结果

使用示例:
    # 提取模式 - CLI
    python slug_manager.py --input src/posts/content --output slugs.tsv

    # 提取模式 - GUI
    python slug_manager.py --gui

    # 更新模式
    python slug_manager.py --tsv slugs_updated.tsv --input src/posts/content
"""

import argparse
import re
import sys
from pathlib import Path
from typing import Optional

# 尝试导入PyQt5，如果没有则使用tkinter
try:
    from PyQt5.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QPushButton, QLabel, QLineEdit, QFileDialog, QMessageBox,
        QTextEdit, QRadioButton, QButtonGroup, QGroupBox
    )
    from PyQt5.QtCore import Qt
    HAS_PYQT5 = True
except ImportError:
    HAS_PYQT5 = False
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk


# ============ AI提示词模板 ============

AI_PROMPT_TEMPLATE = """
================================================================================
AI任务说明
================================================================================

你正在处理一个博客系统的slug优化任务。

【TSV表格说明】
- file: MD文件名
- current_slug: 当前的slug值
- new_slug: 你需要填写的新slug值

【新slug生成规则】
1. 分析原标题(current_slug)，提取核心英文关键词
2. 新slug必须:
   - 全小写英文字母
   - 不使用任何标点符号
   - 不使用空格，用连字符"-"连接
   - 简洁有力，1-3个单词最佳
   - 准确代表文章主题

【示例】
- "hello-world" → "hello-world" (已是英文，保持不变)
- "日本泡沫的繁荣危机与破裂" → "japan-bubble"
- "川端康成的美学观" → "kawabata-aesthetics"
- "RUST核心特色" → "rust-features"
- "陀思妥耶夫斯基" → "dostoevsky"

【输出要求】
请读取上方的TSV表格，在new_slug列填入生成的新slug。
保持TSV格式不变，直接输出完整的TSV内容。

================================================================================
"""

IMPORT_INSTRUCTION = """
================================================================================
导入模式说明
================================================================================

正在从TSV文件导入新slug并更新MD文件...

TSV格式要求:
- 必须包含 file, current_slug, new_slug 三列
- file列匹配MD文件名
- new_slug列用于替换MD文件中的slug

================================================================================
"""


# ============ 核心功能函数 ============

def extract_yaml_frontmatter(content: str) -> tuple[Optional[str], Optional[str]]:
    """提取YAML frontmatter"""
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)
    if match:
        return match.group(1), match.group(2)
    return None, None


def extract_slug_from_yaml(yaml_content: str) -> Optional[str]:
    """从YAML中提取slug字段"""
    pattern = r'^slug:\s*["\']?(.+?)["\']?\s*$'
    for line in yaml_content.split('\n'):
        match = re.match(pattern, line.strip())
        if match:
            return match.group(1).strip('"\'')
    return None


def update_slug_in_yaml(yaml_content: str, new_slug: str) -> str:
    """更新YAML中的slug字段"""
    pattern = r'^(slug:\s*["\']?)(.+?)(["\']?\s*)$'

    def replace_slug(match):
        return f'{match.group(1)}{new_slug}{match.group(3)}'

    lines = yaml_content.split('\n')
    new_lines = []
    for line in lines:
        if re.match(r'^slug:', line.strip()):
            new_line = re.sub(pattern, replace_slug, line, flags=re.MULTILINE)
            new_lines.append(new_line)
        else:
            new_lines.append(line)

    return '\n'.join(new_lines)


def scan_md_files(input_path: Path) -> list[dict]:
    """扫描MD文件并提取slug信息"""
    results = []

    if input_path.is_file():
        md_files = [input_path]
    else:
        md_files = list(input_path.rglob('*.md'))

    for md_file in md_files:
        try:
            content = md_file.read_text(encoding='utf-8')
            yaml_content, body_content = extract_yaml_frontmatter(content)

            if yaml_content:
                slug = extract_slug_from_yaml(yaml_content)
                if slug:
                    # 安全地获取相对路径
                    try:
                        rel_path = str(md_file.relative_to(Path.cwd()))
                    except ValueError:
                        rel_path = str(md_file)

                    results.append({
                        'file': md_file.name,
                        'path': rel_path,
                        'current_slug': slug,
                        'new_slug': ''  # 待AI填写
                    })
        except Exception as e:
            print(f"  ⚠ 跳过文件 {md_file.name}: {e}")

    return results


def export_to_tsv(data: list[dict], output_path: Path) -> bool:
    """导出数据到TSV文件"""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            # 写入表头
            f.write('file\tcurrent_slug\tnew_slug\n')
            # 写入数据
            for item in data:
                f.write(f"{item['file']}\t{item['current_slug']}\t{item['new_slug']}\n")
        return True
    except Exception as e:
        print(f"导出TSV失败: {e}")
        return False


def import_from_tsv(tsv_path: Path) -> list[dict]:
    """从TSV文件导入数据"""
    data = []
    try:
        with open(tsv_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # 跳过表头
        for line in lines[1:]:
            line = line.strip()
            if line:
                parts = line.split('\t')
                if len(parts) >= 3:
                    data.append({
                        'file': parts[0],
                        'current_slug': parts[1],
                        'new_slug': parts[2]
                    })
        return data
    except Exception as e:
        print(f"导入TSV失败: {e}")
        return []


def update_md_slugs(input_path: Path, slug_mapping: dict) -> dict:
    """更新MD文件中的slug"""
    stats = {'updated': 0, 'skipped': 0, 'errors': 0}

    if input_path.is_file():
        md_files = [input_path]
    else:
        md_files = list(input_path.rglob('*.md'))

    for md_file in md_files:
        if md_file.name not in slug_mapping:
            stats['skipped'] += 1
            continue

        try:
            content = md_file.read_text(encoding='utf-8')
            yaml_content, body_content = extract_yaml_frontmatter(content)

            if yaml_content:
                new_slug = slug_mapping[md_file.name]
                new_yaml = update_slug_in_yaml(yaml_content, new_slug)
                new_content = f"---\n{new_yaml}\n---\n{body_content}"
                md_file.write_text(new_content, encoding='utf-8')
                stats['updated'] += 1
                print(f"  ✓ 更新: {md_file.name} -> {new_slug}")
            else:
                stats['skipped'] += 1
        except Exception as e:
            stats['errors'] += 1
            print(f"  ✗ 错误: {md_file.name} - {e}")

    return stats


def print_tsv_for_ai(data: list[dict]):
    """打印TSV表格和AI提示词"""
    print("\n" + "=" * 80)
    print("TSV表格内容 (可复制给AI处理)")
    print("=" * 80)
    print('file\tcurrent_slug\tnew_slug')
    for item in data:
        print(f"{item['file']}\t{item['current_slug']}\t{item['new_slug']}")
    print("=" * 80)

    # 打印AI提示词
    print(AI_PROMPT_TEMPLATE)

    print("\n【操作说明】")
    print("1. 复制上方的TSV表格内容")
    print("2. 将TSV和提示词发送给AI")
    print("3. AI生成new_slug后，保存到新的TSV文件")
    print("4. 运行: python slug_manager.py --tsv 新tsv文件 --input MD目录")
    print("=" * 80)


# ============ CLI模式 ============

def run_cli(args):
    """命令行模式"""
    if args.tsv:
        # 导入模式 - 静默处理
        print(IMPORT_INSTRUCTION)

        tsv_path = Path(args.tsv)
        if not tsv_path.exists():
            print(f"✗ TSV文件不存在: {tsv_path}")
            sys.exit(1)

        input_path = Path(args.input) if args.input else Path('.')
        if not input_path.exists():
            print(f"✗ 输入路径不存在: {input_path}")
            sys.exit(1)

        # 导入TSV
        data = import_from_tsv(tsv_path)
        if not data:
            print("✗ TSV文件为空或格式错误")
            sys.exit(1)

        # 构建slug映射
        slug_mapping = {item['file']: item['new_slug'] for item in data if item['new_slug']}
        print(f"从TSV读取到 {len(slug_mapping)} 个新slug映射\n")

        # 更新MD文件
        stats = update_md_slugs(input_path, slug_mapping)

        print(f"\n{'=' * 80}")
        print("更新完成!")
        print(f"{'=' * 80}")
        print(f"已更新: {stats['updated']}")
        print(f"已跳过: {stats['skipped']}")
        print(f"错误: {stats['errors']}")

    elif args.input:
        # 提取模式 - 打印TSV和提示词
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"✗ 输入路径不存在: {input_path}")
            sys.exit(1)

        print(f"{'=' * 80}")
        print("MD文件Slug提取工具")
        print(f"{'=' * 80}")
        print(f"扫描路径: {input_path.absolute()}")

        # 扫描MD文件
        data = scan_md_files(input_path)
        print(f"找到 {len(data)} 个带slug的MD文件\n")

        if data:
            # 输出到文件
            output_path = Path(args.output) if args.output else Path('slugs.tsv')
            if export_to_tsv(data, output_path):
                print(f"✓ TSV已保存到: {output_path.absolute()}\n")

            # 打印TSV和AI提示词
            print_tsv_for_ai(data)

    else:
        print("请指定 --input 或 --tsv 参数，或使用 --gui 启动图形界面")
        print("\n使用示例:")
        print("  提取: python slug_manager.py --input src/posts/content")
        print("  更新: python slug_manager.py --tsv slugs_updated.tsv --input src/posts/content")
        print("  GUI:  python slug_manager.py --gui")


# ============ GUI模式 (PyQt5) ============

class SlugManagerGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MD Slug管理工具")
        self.setMinimumSize(700, 500)
        self.init_ui()

    def init_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setSpacing(15)
        layout.setContentsMargins(20, 20, 20, 20)

        # 标题
        title = QLabel("MD文件Slug管理工具")
        title_font = title.font()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title.setFont(title_font)
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        # 模式选择
        mode_group = QGroupBox("操作模式")
        mode_layout = QVBoxLayout(mode_group)

        self.mode_extract = QRadioButton("提取模式 - 扫描MD文件并导出TSV")
        self.mode_extract.setChecked(True)
        mode_layout.addWidget(self.mode_extract)

        self.mode_import = QRadioButton("导入模式 - 从TSV导入并更新MD文件")
        mode_layout.addWidget(self.mode_import)

        layout.addWidget(mode_group)

        # MD目录选择
        md_group = QGroupBox("MD文件目录")
        md_layout = QHBoxLayout(md_group)
        self.md_path = QLineEdit()
        self.md_path.setPlaceholderText("选择MD文件或目录...")
        md_layout.addWidget(self.md_path)
        md_btn = QPushButton("浏览...")
        md_btn.clicked.connect(self.select_md_path)
        md_layout.addWidget(md_btn)
        layout.addWidget(md_group)

        # TSV文件选择
        tsv_group = QGroupBox("TSV文件 (导入模式时需要)")
        tsv_layout = QHBoxLayout(tsv_group)
        self.tsv_path = QLineEdit()
        self.tsv_path.setPlaceholderText("选择TSV文件...")
        tsv_layout.addWidget(self.tsv_path)
        tsv_btn = QPushButton("浏览...")
        tsv_btn.clicked.connect(self.select_tsv_file)
        tsv_layout.addWidget(tsv_btn)
        layout.addWidget(tsv_group)

        # 执行按钮
        self.run_btn = QPushButton("开始处理")
        self.run_btn.setMinimumHeight(45)
        self.run_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                font-weight: bold;
                font-size: 14px;
                border-radius: 8px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        self.run_btn.clicked.connect(self.run_process)
        layout.addWidget(self.run_btn)

        # 日志区域
        log_label = QLabel("处理日志:")
        layout.addWidget(log_label)

        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMinimumHeight(200)
        layout.addWidget(self.log_text)

        layout.addStretch()

    def select_md_path(self):
        path = QFileDialog.getExistingDirectory(self, "选择MD文件目录")
        if path:
            self.md_path.setText(path)

    def select_tsv_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "选择TSV文件", "", "TSV文件 (*.tsv)")
        if path:
            self.tsv_path.setText(path)

    def log(self, message):
        self.log_text.append(message)

    def run_process(self):
        md_path = self.md_path.text()
        if not md_path:
            QMessageBox.warning(self, "提示", "请先选择MD文件目录")
            return

        self.log_text.clear()

        if self.mode_extract.isChecked():
            # 提取模式
            self.log("【提取模式】扫描MD文件...")
            data = scan_md_files(Path(md_path))
            self.log(f"找到 {len(data)} 个带slug的MD文件")

            if data:
                output_path = Path('slugs.tsv')
                export_to_tsv(data, output_path)
                self.log(f"✓ TSV已保存到: {output_path.absolute()}")

                # 显示TSV和提示词
                self.log("\n" + "=" * 60)
                self.log("TSV表格内容:")
                self.log("=" * 60)
                self.log('file\tcurrent_slug\tnew_slug')
                for item in data:
                    self.log(f"{item['file']}\t{item['current_slug']}\t{item['new_slug']}")
                self.log("=" * 60)

                self.log("\n【AI提示词】")
                self.log(AI_PROMPT_TEMPLATE)

                self.log("\n【下一步】")
                self.log("1. 复制TSV表格和提示词发送给AI")
                self.log("2. AI生成new_slug后保存到新TSV文件")
                self.log("3. 切换到导入模式，选择新TSV文件并执行")

        else:
            # 导入模式
            tsv_path = self.tsv_path.text()
            if not tsv_path:
                QMessageBox.warning(self, "提示", "请先选择TSV文件")
                return

            self.log("【导入模式】从TSV导入并更新MD文件...")
            data = import_from_tsv(Path(tsv_path))
            self.log(f"从TSV读取到 {len(data)} 条记录")

            slug_mapping = {item['file']: item['new_slug'] for item in data if item['new_slug']}
            self.log(f"有效slug映射: {len(slug_mapping)} 个")

            stats = update_md_slugs(Path(md_path), slug_mapping)

            self.log(f"\n更新完成!")
            self.log(f"已更新: {stats['updated']}")
            self.log(f"已跳过: {stats['skipped']}")
            self.log(f"错误: {stats['errors']}")


# ============ GUI模式 (Tkinter备选) ============

def run_tkinter_gui():
    """Tkinter GUI模式"""
    root = tk.Tk()
    root.title("MD Slug管理工具")
    root.geometry("700x500")

    # 标题
    tk.Label(root, text="MD文件Slug管理工具", font=("Arial", 16, "bold")).pack(pady=10)

    # 模式选择
    mode_frame = tk.LabelFrame(root, text="操作模式", padx=10, pady=5)
    mode_frame.pack(fill="x", padx=20, pady=5)

    mode_var = tk.StringVar(value="extract")
    tk.Radiobutton(mode_frame, text="提取模式 - 扫描MD文件并导出TSV",
                   variable=mode_var, value="extract").pack(anchor="w")
    tk.Radiobutton(mode_frame, text="导入模式 - 从TSV导入并更新MD文件",
                   variable=mode_var, value="import").pack(anchor="w")

    # MD路径
    md_frame = tk.LabelFrame(root, text="MD文件目录", padx=10, pady=5)
    md_frame.pack(fill="x", padx=20, pady=5)

    md_path_var = tk.StringVar()
    tk.Entry(md_frame, textvariable=md_path_var).pack(side="left", fill="x", expand=True)

    def select_md():
        path = filedialog.askdirectory()
        if path:
            md_path_var.set(path)

    tk.Button(md_frame, text="浏览...", command=select_md).pack(side="right")

    # TSV路径
    tsv_frame = tk.LabelFrame(root, text="TSV文件 (导入模式时需要)", padx=10, pady=5)
    tsv_frame.pack(fill="x", padx=20, pady=5)

    tsv_path_var = tk.StringVar()
    tk.Entry(tsv_frame, textvariable=tsv_path_var).pack(side="left", fill="x", expand=True)

    def select_tsv():
        path = filedialog.askopenfilename(filetypes=[("TSV文件", "*.tsv")])
        if path:
            tsv_path_var.set(path)

    tk.Button(tsv_frame, text="浏览...", command=select_tsv).pack(side="right")

    # 日志区域
    log_frame = tk.LabelFrame(root, text="处理日志", padx=10, pady=5)
    log_frame.pack(fill="both", expand=True, padx=20, pady=5)

    log_text = tk.Text(log_frame, height=10)
    log_text.pack(fill="both", expand=True)

    def log(message):
        log_text.insert("end", message + "\n")
        log_text.see("end")
        root.update()

    # 执行按钮
    def run_process():
        md_path = md_path_var.get()
        if not md_path:
            messagebox.showwarning("提示", "请先选择MD文件目录")
            return

        log_text.delete(1.0, "end")

        if mode_var.get() == "extract":
            log("【提取模式】扫描MD文件...")
            data = scan_md_files(Path(md_path))
            log(f"找到 {len(data)} 个带slug的MD文件")

            if data:
                output_path = Path('slugs.tsv')
                export_to_tsv(data, output_path)
                log(f"✓ TSV已保存到: {output_path.absolute()}")

                log("\n" + "=" * 60)
                log("TSV表格内容:")
                log("=" * 60)
                log('file\tcurrent_slug\tnew_slug')
                for item in data:
                    log(f"{item['file']}\t{item['current_slug']}\t{item['new_slug']}")
                log("=" * 60)

                log("\n【AI提示词】")
                log(AI_PROMPT_TEMPLATE)

        else:
            tsv_path = tsv_path_var.get()
            if not tsv_path:
                messagebox.showwarning("提示", "请先选择TSV文件")
                return

            log("【导入模式】从TSV导入并更新MD文件...")
            data = import_from_tsv(Path(tsv_path))
            log(f"从TSV读取到 {len(data)} 条记录")

            slug_mapping = {item['file']: item['new_slug'] for item in data if item['new_slug']}
            log(f"有效slug映射: {len(slug_mapping)} 个")

            stats = update_md_slugs(Path(md_path), slug_mapping)

            log(f"\n更新完成!")
            log(f"已更新: {stats['updated']}")
            log(f"已跳过: {stats['skipped']}")
            log(f"错误: {stats['errors']}")

    tk.Button(root, text="开始处理", command=run_process,
              bg="#4CAF50", fg="white", font=("Arial", 12, "bold"),
              height=2).pack(fill="x", padx=20, pady=10)

    root.mainloop()


def run_gui():
    """启动GUI"""
    if HAS_PYQT5:
        app = QApplication(sys.argv)
        app.setStyle('Fusion')
        window = SlugManagerGUI()
        window.show()
        sys.exit(app.exec_())
    else:
        run_tkinter_gui()


# ============ 主入口 ============

def main():
    parser = argparse.ArgumentParser(
        description='MD文件Slug管理工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 提取模式 - 扫描MD文件并导出TSV
  python slug_manager.py --input src/posts/content

  # 提取模式 - 指定输出文件
  python slug_manager.py --input src/posts/content --output my_slugs.tsv

  # 导入模式 - 从TSV更新MD文件
  python slug_manager.py --tsv slugs_updated.tsv --input src/posts/content

  # GUI模式
  python slug_manager.py --gui
        """
    )

    parser.add_argument('--input', '-i', help='输入文件或目录路径(支持相对路径)')
    parser.add_argument('--tsv', '-t', help='TSV文件路径(导入模式)')
    parser.add_argument('--output', '-o', default='slugs.tsv', help='输出TSV文件路径(默认: slugs.tsv)')
    parser.add_argument('--gui', '-g', action='store_true', help='启动图形界面')

    args = parser.parse_args()

    if args.gui or (not args.input and not args.tsv):
        run_gui()
    else:
        run_cli(args)


if __name__ == "__main__":
    main()
