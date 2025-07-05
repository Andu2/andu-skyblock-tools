"""
Claude made this script
Thanks Claude
"""

import os
import sys
from PIL import Image
import argparse

def resize_images(input_dir, output_dir, max_size=(800, 600), quality=85):
    """
    Resize images in a directory to smaller versions
    
    Args:
        input_dir: Path to input directory
        output_dir: Path to output directory
        max_size: Tuple of (max_width, max_height)
        quality: JPEG quality (1-100)
    """
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Supported image formats
    supported_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    
    processed = 0
    errors = 0
    
    for filename in os.listdir(input_dir):
        file_path = os.path.join(input_dir, filename)
        
        # Skip if not a file
        if not os.path.isfile(file_path):
            continue
            
        # Check if file has supported extension
        file, ext = os.path.splitext(filename)
        if ext.lower() not in supported_formats:
            continue
            
        try:
            # Open and process image
            with Image.open(file_path) as img:
                # Calculate new size maintaining aspect ratio
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Prepare output path
                outfile = file + '_small' + ext
                output_path = os.path.join(output_dir, outfile)
                
                # Save with optimization
                if ext in ['.jpg', '.jpeg']:
                    img.save(output_path, 'JPEG', quality=quality, optimize=True)
                elif ext == '.png':
                    img.save(output_path, 'PNG', optimize=True)
                else:
                    img.save(output_path, optimize=True)
                
                # Get file sizes for comparison
                original_size = os.path.getsize(file_path)
                new_size = os.path.getsize(output_path)
                reduction = (1 - new_size/original_size) * 100
                
                print(f"✓ {outfile}: {original_size//1024}KB → {new_size//1024}KB ({reduction:.1f}% reduction)")
                processed += 1
                
        except Exception as e:
            print(f"✗ Error processing {filename}: {e}")
            errors += 1
    
    print(f"\nProcessed {processed} images, {errors} errors")

def main():
    parser = argparse.ArgumentParser(description='Resize images in a directory')
    parser.add_argument('input_dir', help='Input directory path')
    parser.add_argument('output_dir', help='Output directory path')
    parser.add_argument('--width', type=int, default=800, help='Max width (default: 800)')
    parser.add_argument('--height', type=int, default=600, help='Max height (default: 600)')
    parser.add_argument('--quality', type=int, default=85, help='JPEG quality 1-100 (default: 85)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_dir):
        print(f"Error: Input directory '{args.input_dir}' does not exist")
        sys.exit(1)
    
    print(f"Resizing images from '{args.input_dir}' to '{args.output_dir}'")
    print(f"Max size: {args.width}x{args.height}, Quality: {args.quality}")
    
    resize_images(args.input_dir, args.output_dir, (args.width, args.height), args.quality)

if __name__ == "__main__":
    main()
