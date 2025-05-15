#!/usr/bin/env python3
"""
A simple Python program to call the multi-file diff API of Diffie.
This script sends a list of file pairs to the Diffie server for comparison.
"""

import requests
import json
import sys

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

def display_results(results):
    """
    Display the diff results in a side-by-side format.
    
    Args:
        results: The JSON response from the server
    """
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

def main():
    # Define the file pairs to compare
    # These are relative to the BASE_PATH defined in config.js
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
    
    # Call the multi-diff API
    results = multi_diff(file_pairs)
    
    # Display the results
    display_results(results)

if __name__ == "__main__":
    main()