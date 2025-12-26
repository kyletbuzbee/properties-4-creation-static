#!/usr/bin/env python3
"""
Enhanced File Converter - Single File Output with Directory Exclusion
Converts source code files to append to a single .txt format file.

Features:
- Excludes node_modules, codeReview, .git, and .clinerules directories during scanning
- Outputs everything to one single text file (append mode)
- Command-line configurable source folder and output file
- Progress tracking with detailed output
- Enhanced error handling and reporting
- Configurable file extensions
- Statistics and summary reporting
- Windows-compatible (no emoji characters)
"""

import os
import sys
import argparse
from datetime import datetime
from pathlib import Path


class SingleFileConverter:
    '''Enhanced file converter with single file append output.'''
    
    def __init__(self, source_folder, output_file, extensions=None, exclude_extensions=None):
        self.source_folder = Path(source_folder)
        self.output_file = Path(output_file)
        self.extensions = extensions or ['.html', '.json', '.js', '.css', '.njk', '.yml', '.yaml', '.ts', '.tsx', '.jsx', '.vue', '.java', '.c', '.cpp', '.h', '.cs', '.rb', '.go', '.rs', '.php', '.sh', '.xml', '.csv']
        self.exclude_extensions = exclude_extensions or ['.png', '.jpg', '.jpeg', '.svg', '.mp4', '.webm', '.ico', '.woff', '.woff2', '.txt', '.py','.md'] 
        self.exclude_directories = ['node_modules', 'codeReview', '.git', '.clinerules', '.txt', '.md', '.py']
        self.progress = 0
        self.skipped_files = []
        self.error_files = []
        self.stats = {
            "total_files": 0,
            "converted": 0,
            "skipped": 0,
            "errors": 0,
            "total_chars": 0,
            "total_lines": 0
        }
        
    def should_convert_file(self, file_path):
        '''Determine if a file should be converted.'''
        # Check if file extension matches conversion criteria
        file_ext = file_path.suffix.lower()

        # Skip binary files
        if file_ext in self.exclude_extensions:
            return False, 'binary file'

        # Skip if extension not in conversion list
        if file_ext not in self.extensions:
            return False, 'unsupported extension'

        return True, None

    def generate_project_tree(self):
        '''Generate a text-based project tree excluding specified directories.'''
        tree_lines = []

        def add_tree(path, prefix=''):
            try:
                items = sorted(os.listdir(path))
            except PermissionError:
                return

            filtered_items = []
            for item in items:
                full_path = os.path.join(path, item)
                if os.path.isdir(full_path) and item in self.exclude_directories:
                    continue
                filtered_items.append(item)

            for i, item in enumerate(filtered_items):
                full_path = os.path.join(path, item)
                is_last = (i == len(filtered_items) - 1)
                connector = '└── ' if is_last else '├── '
                tree_lines.append(prefix + connector + item)

                if os.path.isdir(full_path):
                    extension = '    ' if is_last else '│   '
                    add_tree(full_path, prefix + extension)

        tree_lines.append('.')
        add_tree(str(self.source_folder))
        return '\n'.join(tree_lines)
        
    def format_file_separator(self, file_path, is_first=False):
        '''Create a formatted file separator.'''
        relative_path = file_path.relative_to(self.source_folder)
        separator = []
        
        if is_first:
            separator.append('=' * 80)
        else:
            separator.append('-' * 80)
            
        separator.append(f'FILE: {relative_path}')
        separator.append(f'SIZE: {file_path.stat().st_size:} bytes')
        separator.append(f'MODIFIED: {datetime.fromtimestamp(file_path.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')}')
        separator.append('=' * 80)
        
        return '\n'.join(separator)
        
    def convert_and_append_file(self, file_path, is_first=False):
        '''Convert a single file and append to the output file.'''
        try:
            # Read file content with proper encoding handling
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Try with different encoding if UTF-8 fails
                with open(file_path, 'r', encoding='latin-1') as f:
                    content = f.read()
                    
            if not content.strip():
                return False, 'empty file'
                
            # Calculate stats
            lines = len(content.splitlines())
            chars = len(content)
            
            # Append to single output file
            with open(self.output_file, 'a', encoding='utf-8') as output:
                # Add file separator
                separator = self.format_file_separator(file_path, is_first)
                output.write(separator)
                output.write('\n')
                
                # Add file content
                output.write(content)
                output.write('\n\n')
                
            # Update stats
            self.stats['converted'] += 1
            self.stats['total_chars'] += chars
            self.stats['total_lines'] += lines
            
            return True, f'converted ({lines} lines, {chars} chars)'
            
        except Exception as e:
            self.stats['errors'] += 1
            error_msg = f'error: {str(e)}'
            self.error_files.append({"file": str(file_path), "error": error_msg})
            return False, error_msg
            
    def process_files(self):
        '''Process all files in the source directory, excluding specified directories.'''
        print(f'[SEARCH] Scanning source folder: {self.source_folder}')
        print(f'[EXCLUDE] Skipping directories: {', '.join(self.exclude_directories)}')
        print(f'[FILE] Looking for extensions: {', '.join(self.extensions)}')
        print(f'[SKIP] Excluding: {', '.join(self.exclude_extensions)}')
        print(f'[OUTPUT] Single file mode: {self.output_file}')
        print('-' * 60)
        
        # Clear the output file at start
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_file, 'w', encoding='utf-8') as f:
            f.write(f'CONSOLIDATED PROJECT FILES\n')
            f.write(f'Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n')
            f.write(f'Source: {self.source_folder}\n')
            f.write(f'Output: {self.output_file}\n')
            f.write('=' * 80 + '\n\n')

            # Generate and append project tree
            project_tree = self.generate_project_tree()
            f.write('PROJECT TREE:\n')
            f.write(project_tree)
            f.write('\n\n' + '=' * 80 + '\n\n')
        
        # Get all files for processing (excluding specified directories)
        all_files = []
        for root, dirs, files in os.walk(self.source_folder):
            # Remove excluded directories from dirs to prevent walking into them
            dirs[:] = [d for d in dirs if d not in self.exclude_directories]
            
            root_path = Path(root)
            for file in files:
                file_path = root_path / file
                all_files.append(file_path)
        
        # Sort files for consistent ordering
        all_files.sort(key=lambda x: x.relative_to(self.source_folder))
        
        # Process each file
        for i, file_path in enumerate(all_files):
            self.stats['total_files'] += 1
            
            # Check if file should be converted
            should_convert, reason = self.should_convert_file(file_path)
            
            if should_convert:
                is_first = (self.stats['converted'] == 0)
                success, message = self.convert_and_append_file(file_path, is_first)
                if success:
                    print(f'[OK] {file_path.relative_to(self.source_folder)} -> {message}')
                else:
                    print(f'[FAIL] {file_path.relative_to(self.source_folder)} -> {message}')
                    self.skipped_files.append(str(file_path))
            else:
                print(f'[SKIP] {file_path.relative_to(self.source_folder)} -> skipped ({reason})')
                self.stats['skipped'] += 1
                self.skipped_files.append(str(file_path))
                
    def generate_summary_report(self):
        '''Generate detailed conversion summary.'''
        report_lines = []
        report_lines.append('=' * 80)
        report_lines.append('FILE CONVERSION SUMMARY REPORT')
        report_lines.append('=' * 80)
        report_lines.append(f'Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}')
        report_lines.append(f'Source folder: {self.source_folder}')
        report_lines.append(f'Output file: {self.output_file}')
        report_lines.append(f'Excluded directories: {', '.join(self.exclude_directories)}')
        report_lines.append('')
        
        # Statistics
        report_lines.append('STATISTICS:')
        report_lines.append('-' * 40)
        report_lines.append(f'Total files scanned: {self.stats['total_files']}')
        report_lines.append(f'Files converted: {self.stats['converted']}')
        report_lines.append(f'Files skipped: {self.stats['skipped']}')
        report_lines.append(f'Errors: {self.stats['errors']}')
        report_lines.append(f'Total characters: {self.stats['total_chars']:}')
        report_lines.append(f'Total lines: {self.stats['total_lines']:}')
        report_lines.append('')
        
        # Skipped files
        if self.skipped_files:
            report_lines.append('SKIPPED FILES:')
            report_lines.append('-' * 40)
            for file_path in self.skipped_files:
                rel_path = Path(file_path).relative_to(self.source_folder)
                report_lines.append(f'{rel_path}')
            report_lines.append('')
            
        # Error files
        if self.error_files:
            report_lines.append('ERROR FILES:')
            report_lines.append('-' * 40)
            for error_info in self.error_files:
                rel_path = Path(error_info['file']).relative_to(self.source_folder)
                report_lines.append(f'{rel_path}: {error_info['error']}')
            report_lines.append('')
            
        report_lines.append('=' * 80)
        
        # Save summary report
        summary_path = self.output_file.parent / 'conversion_summary.txt'
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))
            
        return summary_path, '\n'.join(report_lines)
        
    def run(self):
        '''Execute the conversion process.'''
        print('[START] Starting single-file conversion process')
        print('=' * 60)
        
        try:
            # Validate source folder
            if not self.source_folder.exists():
                print(f'[ERROR] Source folder does not exist: {self.source_folder}')
                return False
                
            # Process files
            self.process_files()
            
            # Generate summary report
            summary_path, summary_content = self.generate_summary_report()
            
            # Print summary
            print('\n' + '=' * 60)
            print('[SUCCESS] CONVERSION COMPLETED SUCCESSFULLY!')
            print('=' * 60)
            print(f'[STATS] Summary:')
            print(f'   * Files converted: {self.stats['converted']}')
            print(f'   * Files skipped: {self.stats['skipped']}')
            print(f'   * Errors: {self.stats['errors']}')
            print(f'   * Total characters: {self.stats['total_chars']:}')
            print(f'   * Total lines: {self.stats['total_lines']:}')
            print(f'\n[FILE] Single output file: {self.output_file}')
            print(f'[SUMMARY] Report: {summary_path}')
            
            return True
            
        except Exception as e:
            print(f'[ERROR] Fatal error during conversion: {e}')
            return False


def main():
    '''Main function with command-line argument parsing.'''
    parser = argparse.ArgumentParser(
        description='Convert source code files to single .txt file (append mode).',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    epilog="""
Examples:
  python convert_to_text_enhanced.py
  python convert_to_text_enhanced.py --source ./src --output ./all_code.txt
  python convert_to_text_enhanced.py --extensions .html,.js,.css --exclude .png,.jpg
        """
    )
    
    parser.add_argument(
        '--source', 
        default='.',
        help='Source folder to scan (default: current directory)'
    )
    
    parser.add_argument(
        '--output',
        default='consolidated_output.txt',
        help='Output file for all converted content (default: consolidated_output.txt)'
    )
    
    parser.add_argument(
        '--extensions',
        help='Comma-separated list of file extensions to convert (e.g., .html,.js,.css)'
    )
    
    parser.add_argument(
        '--exclude',
        help='Comma-separated list of file extensions to exclude (e.g., .png,.jpg,.gif)'
    )
    
    args = parser.parse_args()
    
    # Process extensions
    extensions = None
    if args.extensions:
        extensions = [ext.strip() for ext in args.extensions.split(',')]
        
    exclude_extensions = None
    if args.exclude:
        exclude_extensions = [ext.strip() for ext in args.exclude.split(',')]
    
    # Create converter and run
    converter = SingleFileConverter(
        source_folder=args.source,
        output_file=args.output,
        extensions=extensions,
        exclude_extensions=exclude_extensions
    )
    
    success = converter.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()