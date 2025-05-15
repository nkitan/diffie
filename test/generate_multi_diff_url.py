#!/usr/bin/env python3
"""
A utility script to generate URLs for the Diffie multi-file comparison.
"""

import urllib.parse
import argparse
import json
import sys

def generate_multi_diff_url(file_pairs, base_url="http://localhost:3000"):
    """
    Generate a URL for the Diffie multi-file comparison.
    
    Args:
        file_pairs: A list of tuples or dictionaries, each containing file1 and file2 paths
        base_url: The base URL of the Diffie server
    
    Returns:
        The URL string
    """
    params = []
    for pair in file_pairs:
        if isinstance(pair, dict):
            file1 = pair.get('file1', '')
            file2 = pair.get('file2', '')
        elif isinstance(pair, (list, tuple)) and len(pair) >= 2:
            file1, file2 = pair[0], pair[1]
        else:
            continue
            
        if file1 and file2:
            params.append(('pairs', f"{file1},{file2}"))
    
    query_string = urllib.parse.urlencode(params)
    return f"{base_url}/?{query_string}"

def parse_arguments():
    """
    Parse command-line arguments.
    
    Returns:
        The parsed arguments
    """
    parser = argparse.ArgumentParser(description='Generate a URL for the Diffie multi-file comparison')
    
    parser.add_argument('--server', default='http://localhost:3000',
                        help='The base URL of the Diffie server (default: http://localhost:3000)')
    
    parser.add_argument('--pairs', nargs='+', action='append', metavar=('FILE1', 'FILE2'),
                        help='File pairs to compare (can be specified multiple times)')
    
    parser.add_argument('--file', type=str,
                        help='Path to a JSON file containing file pairs')
    
    parser.add_argument('--output', choices=['url', 'html'], default='url',
                        help='Output format (default: url)')
    
    return parser.parse_args()

def main():
    args = parse_arguments()
    file_pairs = []
    
    # Load file pairs from command-line arguments
    if args.pairs:
        for pair in args.pairs:
            if len(pair) >= 2:
                file_pairs.append((pair[0], pair[1]))
    
    # Load file pairs from JSON file
    if args.file:
        try:
            with open(args.file, 'r') as f:
                file_data = json.load(f)
                if isinstance(file_data, list):
                    for pair in file_data:
                        if isinstance(pair, dict) and 'file1' in pair and 'file2' in pair:
                            file_pairs.append((pair['file1'], pair['file2']))
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Error loading file pairs from {args.file}: {e}", file=sys.stderr)
            sys.exit(1)
    
    # If no file pairs were specified, use default examples
    if not file_pairs:
        file_pairs = [
            ('sample1.txt', 'sample2.txt'),
            ('sample1.txt', 'lorem/ipsum.txt'),
            ('sample2.txt', 'sample2.txt')
        ]
        print("No file pairs specified. Using default examples.", file=sys.stderr)
    
    # Generate the URL
    url = generate_multi_diff_url(file_pairs, args.server)
    
    # Output the result
    if args.output == 'html':
        print(f'<a href="{url}" target="_blank">Open Multi-Diff Comparison</a>')
    else:
        print(url)

if __name__ == "__main__":
    main()