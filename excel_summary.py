import pandas as pd
path = 'Data Sheet - Research Paper FDP etc.xlsx'
xl = pd.ExcelFile(path)
for sheet in xl.sheet_names:
    df = xl.parse(sheet)
    non_empty = df.dropna(how='all')
    print(f'=== Sheet: {sheet} ===')
    print('Total rows:', len(df))
    print('Non-empty rows:', len(non_empty))
    if len(non_empty) > 0:
        print('First 10 rows:')
        print(non_empty.head(10).to_string(index=False))
    else:
        print('No non-empty rows found.')
    print()