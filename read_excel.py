import pandas as pd
path = 'Data Sheet - Research Paper FDP etc.xlsx'
xl = pd.ExcelFile(path)
print('Sheets:', xl.sheet_names)
for sheet in xl.sheet_names:
    df = xl.parse(sheet, nrows=10)
    print(f'--- Sheet: {sheet} ---')
    print(df.head(10).to_string(index=False))
