with open('ingestion/pipeline.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(':emb::vector', 'CAST(:emb AS vector)')
content = content.replace("':emb'::vector", 'CAST(:emb AS vector)')

with open('ingestion/pipeline.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
print('Verify:')
for i, line in enumerate(content.split('\n')):
    if 'emb' in line.lower():
        print(f'  {i}: {line}')
