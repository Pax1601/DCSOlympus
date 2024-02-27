import socket
from email.utils import formatdate

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)  
sock.bind(('127.0.0.1', 3003))  
sock.listen(5) 

count = 0
while True:  
    connection, address = sock.accept()  
    buf = connection.recv(1024)  
    print(buf.decode("utf-8"))
    if "OPTIONS" in buf.decode("utf-8"):
        resp = (f"""HTTP/1.1 200 OK\r\nDate: {formatdate(timeval=None, localtime=False, usegmt=True)}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: PUT, GET, OPTIONS\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Max-Age: 86400\r\nVary: Accept-Encoding, Origin\r\nKeep-Alive: timeout=2, max=100\r\nConnection: Keep-Alive\r\n""".encode("utf-8"))  
        connection.send(resp)
        if not "PUT" in buf.decode("utf-8"):
            connection.close()
    else: 		
        resp = (f"""HTTP/1.1 200 OK\r\nDate: {formatdate(timeval=None, localtime=False, usegmt=True)}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: PUT, GET, OPTIONS\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Max-Age: 86400\r\nVary: Accept-Encoding, Origin\r\nKeep-Alive: timeout=2, max=100\r\nConnection: Keep-Alive\r\n\r\n{{"Hi": "Wirts!"}}\r\n""".encode("utf-8"))  
        connection.send(resp)
        connection.close()

    count += 1