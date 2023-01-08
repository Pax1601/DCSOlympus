try:
    # Python 2
    from SimpleHTTPServer import test, SimpleHTTPRequestHandler
except ImportError:
    # Python 3
    from http.server import test, SimpleHTTPRequestHandler

test(SimpleHTTPRequestHandler)