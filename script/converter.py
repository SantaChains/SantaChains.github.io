import sys
import io
from pathlib import Path
from PIL import Image
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QProgressBar, QFileDialog, QMessageBox,
    QTextEdit, QComboBox, QGroupBox, QSpinBox, QCheckBox, QSlider,
    QTabWidget, QLineEdit, QGridLayout, QSplitter
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PyQt5.QtGui import QFont, QIcon

# 支持的格式
SUPPORTED_INPUT = ('.png', '.jpg', '.jpeg', '.avif', '.bmp', '.gif', '.tiff', '.tif', '.webp', '.ico')
SUPPORTED_OUTPUT = {
    'PNG': '.png',
    'JPEG': '.jpg',
    'AVIF': '.avif',
    'WebP': '.webp',
    'BMP': '.bmp',
    'TIFF': '.tiff'
}


class ConvertWorker(QThread):
    progress = pyqtSignal(int, int, str)
    finished_signal = pyqtSignal(int, int)
    log_signal = pyqtSignal(str, bool)

    def __init__(self, files, settings):
        super().__init__()
        self.files = files
        self.settings = settings

    def run(self):
        success_count = 0
        fail_count = 0

        for i, file_path in enumerate(self.files, 1):
            success, msg = self.convert_image(file_path)

            if success:
                success_count += 1
            else:
                fail_count += 1

            self.progress.emit(i, len(self.files), msg)

        self.finished_signal.emit(success_count, fail_count)

    def convert_image(self, input_path: str) -> tuple[bool, str]:
        try:
            input_path = Path(input_path)

            if not input_path.exists():
                return False, f"文件不存在: {input_path.name}"

            if input_path.suffix.lower() not in SUPPORTED_INPUT:
                return False, f"不支持的格式: {input_path.suffix}"

            # 确定输出路径
            output_format = self.settings['output_format']
            output_ext = SUPPORTED_OUTPUT[output_format]

            if self.settings['output_folder']:
                output_dir = Path(self.settings['output_folder'])
                output_dir.mkdir(parents=True, exist_ok=True)
            else:
                output_dir = input_path.parent

            output_path = output_dir / f"{input_path.stem}{output_ext}"

            # 处理文件名冲突
            counter = 1
            while output_path.exists() and not self.settings['overwrite']:
                output_path = output_dir / f"{input_path.stem}_{counter}{output_ext}"
                counter += 1

            # 打开图片
            with Image.open(input_path) as img:
                # 转换模式
                if output_format == 'JPEG':
                    if img.mode in ('RGBA', 'LA', 'P'):
                        # 创建白色背景
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        if img.mode in ('RGBA', 'LA'):
                            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                            img = background
                    else:
                        img = img.convert('RGB')
                elif output_format == 'PNG':
                    if img.mode not in ('RGBA', 'RGB'):
                        img = img.convert('RGBA')
                else:
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGBA')
                    else:
                        img = img.convert('RGB')

                # 缩放处理
                if self.settings['resize_enabled']:
                    width = self.settings['width']
                    height = self.settings['height']
                    resize_mode = self.settings['resize_mode']

                    if resize_mode == '固定尺寸':
                        img = img.resize((width, height), Image.Resampling.LANCZOS)
                    elif resize_mode == '等比缩放(宽)':
                        ratio = width / img.width
                        new_height = int(img.height * ratio)
                        img = img.resize((width, new_height), Image.Resampling.LANCZOS)
                    elif resize_mode == '等比缩放(高)':
                        ratio = height / img.height
                        new_width = int(img.width * ratio)
                        img = img.resize((new_width, height), Image.Resampling.LANCZOS)
                    elif resize_mode == '最长边':
                        max_side = max(img.width, img.height)
                        target = max(width, height)
                        if max_side > target:
                            ratio = target / max_side
                            new_size = (int(img.width * ratio), int(img.height * ratio))
                            img = img.resize(new_size, Image.Resampling.LANCZOS)

                # 保存图片
                save_kwargs = {}

                # 质量设置
                if output_format in ['JPEG', 'WebP']:
                    quality = self.settings['quality']
                    save_kwargs['quality'] = quality
                    save_kwargs['optimize'] = True

                if output_format == 'PNG':
                    compression = self.settings['png_compression']
                    save_kwargs['compress_level'] = compression
                    save_kwargs['optimize'] = True

                img.save(output_path, **save_kwargs)

            return True, f"✓ {input_path.name} → {output_path.name}"

        except Exception as e:
            return False, f"✗ {input_path.name} - {str(e)}"


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("图片格式转换工具")
        self.setMinimumSize(850, 700)

        # 存储选中的文件
        self.selected_files = []

        self.init_ui()

    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        main_layout = QHBoxLayout(central_widget)
        main_layout.setSpacing(15)
        main_layout.setContentsMargins(15, 15, 15, 15)

        # 左侧设置面板
        left_panel = self.create_left_panel()
        main_layout.addWidget(left_panel, 1)

        # 右侧文件列表面板
        right_panel = self.create_right_panel()
        main_layout.addWidget(right_panel, 1)

    def create_left_panel(self):
        panel = QGroupBox("转换设置")
        layout = QVBoxLayout(panel)
        layout.setSpacing(15)

        # 输出格式
        format_group = QGroupBox("输出格式")
        format_layout = QVBoxLayout(format_group)
        self.format_combo = QComboBox()
        self.format_combo.addItems(list(SUPPORTED_OUTPUT.keys()))
        self.format_combo.currentTextChanged.connect(self.on_format_changed)
        format_layout.addWidget(self.format_combo)
        layout.addWidget(format_group)

        # 输出目录
        output_group = QGroupBox("输出目录")
        output_layout = QHBoxLayout(output_group)
        self.output_path_edit = QLineEdit()
        self.output_path_edit.setPlaceholderText("默认保存到原文件目录")
        self.output_path_edit.setReadOnly(True)
        output_layout.addWidget(self.output_path_edit)
        self.select_output_btn = QPushButton("浏览...")
        self.select_output_btn.clicked.connect(self.select_output_folder)
        output_layout.addWidget(self.select_output_btn)
        layout.addWidget(output_group)

        # 缩放设置
        resize_group = QGroupBox("尺寸调整")
        resize_layout = QVBoxLayout(resize_group)

        self.resize_checkbox = QCheckBox("启用缩放")
        self.resize_checkbox.stateChanged.connect(self.on_resize_toggle)
        resize_layout.addWidget(self.resize_checkbox)

        resize_grid = QGridLayout()

        resize_grid.addWidget(QLabel("缩放模式:"), 0, 0)
        self.resize_mode_combo = QComboBox()
        self.resize_mode_combo.addItems(['固定尺寸', '等比缩放(宽)', '等比缩放(高)', '最长边'])
        self.resize_mode_combo.setEnabled(False)
        resize_grid.addWidget(self.resize_mode_combo, 0, 1)

        resize_grid.addWidget(QLabel("宽度(px):"), 1, 0)
        self.width_spin = QSpinBox()
        self.width_spin.setRange(1, 10000)
        self.width_spin.setValue(800)
        self.width_spin.setEnabled(False)
        resize_grid.addWidget(self.width_spin, 1, 1)

        resize_grid.addWidget(QLabel("高度(px):"), 2, 0)
        self.height_spin = QSpinBox()
        self.height_spin.setRange(1, 10000)
        self.height_spin.setValue(600)
        self.height_spin.setEnabled(False)
        resize_grid.addWidget(self.height_spin, 2, 1)

        resize_layout.addLayout(resize_grid)
        layout.addWidget(resize_group)

        # 质量/压缩设置
        self.quality_group = QGroupBox("质量设置")
        quality_layout = QVBoxLayout(self.quality_group)

        quality_layout.addWidget(QLabel("图片质量 (仅JPEG/WebP):"))
        quality_slider_layout = QHBoxLayout()
        self.quality_slider = QSlider(Qt.Horizontal)
        self.quality_slider.setRange(1, 100)
        self.quality_slider.setValue(85)
        self.quality_value_label = QLabel("85")
        self.quality_slider.valueChanged.connect(
            lambda v: self.quality_value_label.setText(str(v))
        )
        quality_slider_layout.addWidget(self.quality_slider)
        quality_slider_layout.addWidget(self.quality_value_label)
        quality_layout.addLayout(quality_slider_layout)

        quality_layout.addWidget(QLabel("PNG压缩级别:"))
        png_slider_layout = QHBoxLayout()
        self.png_compression_slider = QSlider(Qt.Horizontal)
        self.png_compression_slider.setRange(0, 9)
        self.png_compression_slider.setValue(6)
        self.png_compression_label = QLabel("6")
        self.png_compression_slider.valueChanged.connect(
            lambda v: self.png_compression_label.setText(str(v))
        )
        png_slider_layout.addWidget(self.png_compression_slider)
        png_slider_layout.addWidget(self.png_compression_label)
        quality_layout.addLayout(png_slider_layout)

        layout.addWidget(self.quality_group)

        # 其他选项
        options_group = QGroupBox("其他选项")
        options_layout = QVBoxLayout(options_group)
        self.overwrite_checkbox = QCheckBox("覆盖已存在文件")
        options_layout.addWidget(self.overwrite_checkbox)
        layout.addWidget(options_group)

        # 开始转换按钮
        self.convert_btn = QPushButton("开始转换")
        self.convert_btn.setMinimumHeight(50)
        self.convert_btn.setStyleSheet("""
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
            QPushButton:disabled {
                background-color: #cccccc;
            }
        """)
        self.convert_btn.clicked.connect(self.start_convert)
        layout.addWidget(self.convert_btn)

        # 进度条
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)

        layout.addStretch()
        return panel

    def create_right_panel(self):
        panel = QGroupBox("文件列表")
        layout = QVBoxLayout(panel)

        # 文件选择按钮
        btn_layout = QHBoxLayout()

        self.add_files_btn = QPushButton("添加文件")
        self.add_files_btn.clicked.connect(self.add_files)
        btn_layout.addWidget(self.add_files_btn)

        self.add_folder_btn = QPushButton("添加文件夹")
        self.add_folder_btn.clicked.connect(self.add_folder)
        btn_layout.addWidget(self.add_folder_btn)

        self.clear_btn = QPushButton("清空列表")
        self.clear_btn.clicked.connect(self.clear_files)
        btn_layout.addWidget(self.clear_btn)

        layout.addLayout(btn_layout)

        # 文件计数
        self.file_count_label = QLabel("已选择: 0 个文件")
        layout.addWidget(self.file_count_label)

        # 文件列表
        self.file_list = QTextEdit()
        self.file_list.setReadOnly(True)
        self.file_list.setPlaceholderText("点击上方按钮添加图片文件...\n\n支持的格式: PNG, JPG, AVIF, WebP, BMP, GIF, TIFF, ICO")
        layout.addWidget(self.file_list)

        # 日志区域
        log_label = QLabel("转换日志:")
        layout.addWidget(log_label)

        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(150)
        self.log_text.setStyleSheet("""
            QTextEdit {
                border: 1px solid #BDBDBD;
                border-radius: 5px;
                background-color: #F5F5F5;
                padding: 5px;
            }
        """)
        layout.addWidget(self.log_text)

        return panel

    def on_format_changed(self, format_name):
        # 根据格式调整UI
        is_jpeg_webp = format_name in ['JPEG', 'WebP']
        is_png = format_name == 'PNG'

        self.quality_slider.setEnabled(is_jpeg_webp)
        self.quality_value_label.setEnabled(is_jpeg_webp)
        self.png_compression_slider.setEnabled(is_png)
        self.png_compression_label.setEnabled(is_png)

    def on_resize_toggle(self, state):
        enabled = state == Qt.Checked
        self.resize_mode_combo.setEnabled(enabled)
        self.width_spin.setEnabled(enabled)
        self.height_spin.setEnabled(enabled)

    def select_output_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "选择输出目录")
        if folder:
            self.output_path_edit.setText(folder)

    def add_files(self):
        files, _ = QFileDialog.getOpenFileNames(
            self,
            "选择图片文件",
            "",
            f"图片文件 ({' '.join(['*' + ext for ext in SUPPORTED_INPUT])})"
        )
        if files:
            self.selected_files.extend(files)
            self.update_file_list()

    def add_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "选择文件夹")
        if folder:
            folder_path = Path(folder)
            for ext in SUPPORTED_INPUT:
                self.selected_files.extend(folder_path.glob(f'*{ext}'))
                self.selected_files.extend(folder_path.glob(f'*{ext.upper()}'))
            # 去重并保持顺序
            seen = set()
            unique_files = []
            for f in self.selected_files:
                path_str = str(f)
                if path_str not in seen:
                    seen.add(path_str)
                    unique_files.append(f)
            self.selected_files = unique_files
            self.update_file_list()

    def clear_files(self):
        self.selected_files = []
        self.update_file_list()

    def update_file_list(self):
        self.file_count_label.setText(f"已选择: {len(self.selected_files)} 个文件")
        if self.selected_files:
            text = "\n".join([f"{i+1}. {Path(f).name}" for i, f in enumerate(self.selected_files)])
            self.file_list.setText(text)
        else:
            self.file_list.clear()

    def get_settings(self):
        return {
            'output_format': self.format_combo.currentText(),
            'output_folder': self.output_path_edit.text() or None,
            'resize_enabled': self.resize_checkbox.isChecked(),
            'resize_mode': self.resize_mode_combo.currentText(),
            'width': self.width_spin.value(),
            'height': self.height_spin.value(),
            'quality': self.quality_slider.value(),
            'png_compression': self.png_compression_slider.value(),
            'overwrite': self.overwrite_checkbox.isChecked()
        }

    def start_convert(self):
        if not self.selected_files:
            QMessageBox.warning(self, "提示", "请先添加要转换的图片文件")
            return

        settings = self.get_settings()

        self.log_text.clear()
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        self.convert_btn.setEnabled(False)
        self.add_files_btn.setEnabled(False)
        self.add_folder_btn.setEnabled(False)
        self.clear_btn.setEnabled(False)

        self.worker = ConvertWorker(self.selected_files, settings)
        self.worker.progress.connect(self.update_progress)
        self.worker.finished_signal.connect(self.convert_finished)
        self.worker.log_signal.connect(self.add_log)
        self.worker.start()

    def update_progress(self, current, total, message):
        self.progress_bar.setMaximum(total)
        self.progress_bar.setValue(current)
        self.add_log(message, True)

    def add_log(self, message, success):
        if message.startswith("✓"):
            color = "green"
        elif message.startswith("✗"):
            color = "red"
        else:
            color = "black"
        self.log_text.append(f'<span style="color: {color};">{message}</span>')

    def convert_finished(self, success_count, fail_count):
        self.progress_bar.setVisible(False)
        self.convert_btn.setEnabled(True)
        self.add_files_btn.setEnabled(True)
        self.add_folder_btn.setEnabled(True)
        self.clear_btn.setEnabled(True)

        if fail_count == 0:
            self.log_text.append(f'<br><span style="color: green; font-weight: bold;">✓ 全部完成! 成功转换 {success_count} 个文件</span>')
            QMessageBox.information(self, "完成", f"转换完成!\n成功: {success_count} 个")
        else:
            self.log_text.append(f'<br><span style="color: orange; font-weight: bold;">⚠ 完成: 成功 {success_count} 个, 失败 {fail_count} 个</span>')
            QMessageBox.warning(self, "完成", f"转换完成!\n成功: {success_count} 个\n失败: {fail_count} 个")


def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')

    # 设置应用样式
    app.setStyleSheet("""
        QGroupBox {
            font-weight: bold;
            border: 1px solid #cccccc;
            border-radius: 6px;
            margin-top: 12px;
            padding-top: 10px;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 10px;
            padding: 0 5px;
        }
        QPushButton {
            padding: 8px 16px;
            border-radius: 4px;
        }
        QComboBox, QSpinBox, QLineEdit {
            padding: 5px;
            border: 1px solid #cccccc;
            border-radius: 4px;
        }
        QSlider::groove:horizontal {
            height: 8px;
            background: #dddddd;
            border-radius: 4px;
        }
        QSlider::handle:horizontal {
            width: 18px;
            background: #4CAF50;
            border-radius: 9px;
            margin: -5px 0;
        }
    """)

    window = MainWindow()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
