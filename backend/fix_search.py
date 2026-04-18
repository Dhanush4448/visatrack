with open('routers/search.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(':vec::vector', 'CAST(:vec AS vector)')

with open('routers/search.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed!')
