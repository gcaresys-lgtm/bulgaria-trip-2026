#!/usr/bin/env python3
"""Simple HTTP server to test the Bulgaria Trip PWA locally"""
import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Bulgaria Trip PWA Server")
        print(f"========================")
        print(f"Local:  http://localhost:{PORT}")
        print(f"Press Ctrl+C to stop")
        httpd.serve_forever()