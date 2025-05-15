#!/usr/bin/env python3
"""
An advanced Python program to call the multi-file diff API of Diffie.
This script allows specifying file pairs via command-line arguments.
"""

import requests
import json
import sys
import argparse

def multi_diff(file_pairs, server_url="http://localhost:3000"):
    """
    Send a list of file pairs to the Diffie server for comparison.
    
    Args:
        file_pairs: A list of dictionaries, each containing 'file1' and 'file2' paths
        server_url: The base URL of the Diffie server
    
    Returns:
        The JSON response from the server
    """
    endpoint = f"{server_url}/api/multi-diff"
    
    # Prepare the request payload
    payload = {
        "filePairs": file_pairs
    }
    
    # Send the POST request
    try:
        response = requests.post(endpoint, json=payload)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        # Get the response data
        response_data = response.json()
        
        # If we need to fetch file contents for side-by-side diff
        if 'results' in response_data:
            for result in response_data['results']:
                # Only fetch content if it's not already included and files are not identical
                if not result.get('identical', True) and (
                    'file1Content' not in result or 'file2Content' not in result):
                    
                    # Fetch file1 content if needed
                    if 'file1Content' not in result:
                        try:
                            file_response = requests.get(
                                f"{server_url}/api/file", 
                                params={"path": result['file1']}
                            )
                            if file_response.status_code == 200:
                                result['file1Content'] = file_response.json().get('content', '')
                        except Exception as e:
                            print(f"Warning: Could not fetch content for {result['file1']}: {e}")
                    
                    # Fetch file2 content if needed
                    if 'file2Content' not in result:
                        try:
                            file_response = requests.get(
                                f"{server_url}/api/file", 
                                params={"path": result['file2']}
                            )
                            if file_response.status_code == 200:
                                result['file2Content'] = file_response.json().get('content', '')
                        except Exception as e:
                            print(f"Warning: Could not fetch content for {result['file2']}: {e}")
        
        return response_data
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")
        sys.exit(1)

def display_results(results, output_format="text"):
    """
    Display the diff results in a side-by-side format.
    
    Args:
        results: The JSON response from the server
        output_format: The format to display results (text, json, or side-by-side)
    """
    if output_format == "json":
        print(json.dumps(results, indent=2))
        return
    
    print("\n=== DIFF RESULTS ===\n")
    
    # Display successful diffs
    if results.get('results'):
        for result in results['results']:
            print(f"Pair {result['index']}: {result['file1']} vs {result['file2']}")
            print(f"Identical: {result['identical']}")
            
            if not result['identical']:
                print("\nSide-by-Side Diff:")
                
                # Split content into lines
                file1_lines = result.get('file1Content', '').splitlines() if 'file1Content' in result else []
                file2_lines = result.get('file2Content', '').splitlines() if 'file2Content' in result else []
                
                # If we don't have the content directly, try to parse it from the diff
                if (not file1_lines or not file2_lines) and 'diff' in result:
                    # This is a simplified approach - for a real implementation,
                    # you would need to parse the unified diff format properly
                    print("Note: Using simplified diff parsing for side-by-side view")
                    
                    # Print the diff header
                    diff_lines = result['diff'].splitlines()
                    for i in range(min(4, len(diff_lines))):
                        print(diff_lines[i])
                    
                    # Print the actual diff content in a simplified side-by-side format
                    for line in diff_lines[4:]:
                        if line.startswith('+'):
                            print(f"{'':50} | {line[1:]}")
                        elif line.startswith('-'):
                            print(f"{line[1:]:50} | ")
                        elif line.startswith(' '):
                            print(f"{line[1:]:50} | {line[1:]}")
                else:
                    # If we have both file contents, create a proper side-by-side view
                    max_lines = max(len(file1_lines), len(file2_lines))
                    max_line_length = 50  # Adjust based on your terminal width
                    
                    # Print header
                    print(f"{result['file1']:^{max_line_length}} | {result['file2']:^{max_line_length}}")
                    print("-" * (max_line_length * 2 + 3))
                    
                    # Print content side by side
                    for i in range(max_lines):
                        left = file1_lines[i] if i < len(file1_lines) else ""
                        right = file2_lines[i] if i < len(file2_lines) else ""
                        
                        # Highlight differences (simplified approach)
                        if i < len(file1_lines) and i < len(file2_lines) and left != right:
                            print(f"{left[:max_line_length]:50} | {right[:max_line_length]}")
                        else:
                            print(f"{left[:max_line_length]:50} | {right[:max_line_length]}")
            
            print("-" * 105)
    
    # Display errors
    if results.get('errors') and len(results['errors']) > 0:
        print("\n=== ERRORS ===\n")
        for error in results['errors']:
            print(f"Pair {error['index']}: {error['error']}")
            print("-" * 80)

def parse_arguments():
    """
    Parse command-line arguments.
    
    Returns:
        The parsed arguments
    """
    parser = argparse.ArgumentParser(description='Call the Diffie multi-file diff API')
    
    parser.add_argument('--server', default='http://localhost:3000',
                        help='The base URL of the Diffie server (default: http://localhost:3000)')
    
    parser.add_argument('--output', choices=['text', 'json', 'side-by-side'], default='side-by-side',
                        help='Output format (default: side-by-side)')
    
    parser.add_argument('--pairs', nargs='+', action='append', metavar=('FILE1', 'FILE2'),
                        help='File pairs to compare (can be specified multiple times)')
    
    parser.add_argument('--file', type=str,
                        help='Path to a JSON file containing file pairs')
    
    return parser.parse_args()

def main():
    args = parse_arguments()
    file_pairs = []
    
    # Load file pairs from command-line arguments
    if args.pairs:
        for i, pair in enumerate(args.pairs):
            if len(pair) >= 2:
                file_pairs.append({
                    "file1": pair[0],
                    "file2": pair[1],
                    "index": i
                })
    
    # Load file pairs from JSON file
    if args.file:
        try:
            with open(args.file, 'r') as f:
                file_data = json.load(f)
                if isinstance(file_data, list):
                    for i, pair in enumerate(file_data):
                        if isinstance(pair, dict) and 'file1' in pair and 'file2' in pair:
                            # Use the provided index or assign a new one
                            if 'index' not in pair:
                                pair['index'] = len(file_pairs) + i
                            file_pairs.append(pair)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Error loading file pairs from {args.file}: {e}")
            sys.exit(1)
    
    # If no file pairs were specified, use default examples
    if not file_pairs:
        file_pairs = [
            {
                "file1": "sample1.txt",
                "file2": "sample2.txt",
                "index": 0
            },
            {
                "file1": "sample1.txt",
                "file2": "lorem/ipsum.txt",
                "index": 1
            },
            {
                "file1": "sample2.txt",
                "file2": "sample2.txt",  # Same file to test identical detection
                "index": 2
            }
        ]
        print("No file pairs specified. Using default examples.")
    
    # Call the multi-diff API
    results = multi_diff(file_pairs, args.server)
    
    # Display the results
    display_results(results, args.output)

if __name__ == "__main__":
    main()