import pandas as pd
df = pd.read_excel('LCA_Disclosure_Data_FY2026_Q2.xlsx', engine='openpyxl')
print(f'Total rows: {len(df)}')
print(f'Columns: {list(df.columns[:10])}')
certified = df[df['CASE_STATUS'].str.upper() == 'CERTIFIED']
print(f'Certified rows: {len(certified)}')