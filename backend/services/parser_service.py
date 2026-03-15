import pandas as pd
import io
import re

class ParserService:
    def __init__(self):
        # Flexible mapping for varying bank formats
        self.column_synonyms = {
            'date': ['date', 'txn date', 'transaction date', 'value date', 'date of txn', 'posting date'],
            'description': ['description', 'narration', 'transaction details', 'particulars', 'remarks', 'trans details', 'transaction name', 'details'],
            'debit': ['debit', 'withdrawal', 'amount debited', 'dr', 'out'],
            'credit': ['credit', 'deposit', 'amount credited', 'cr', 'in'],
            'amount': ['amount', 'txn amt', 'transaction amount', 'value'],
            'type': ['type', 'cr/dr', 'd/c', 'payment type', 'txn type'],
            'balance': ['balance', 'closing balance', 'available balance']
        }
        
    def _find_header_row(self, df):
        """Finds the most likely row containing headers by checking synonym matches."""
        best_row_idx = 0
        max_matches = 0
        
        # Check first 20 rows for headers
        for idx in range(min(20, len(df))):
            row_vals = [str(x).lower().strip() for x in df.iloc[idx].values]
            matches = 0
            for syn_list in self.column_synonyms.values():
                if any(syn in row_vals for syn in syn_list):
                    matches += 1
                    
            if matches > max_matches:
                max_matches = matches
                best_row_idx = idx
                
        return best_row_idx if max_matches >= 2 else 0

    def _map_columns(self, df):
        """Maps detected columns to the standard ['date', 'description', 'amount', 'type'] schema."""
        df.columns = [str(c).lower().strip() for c in df.columns]
        col_map = {}
        
        for std_col, synonyms in self.column_synonyms.items():
            for col in df.columns:
                if col in synonyms and std_col not in col_map:
                    col_map[std_col] = col
                    break
        return col_map

    def _clean_amount(self, val):
        """Strips currency symbols and commas."""
        if pd.isna(val):
            return 0.0
        val_str = str(val).replace(',', '').replace('₹', '').replace('"', '').replace('$', '').strip()
        try:
            return float(val_str)
        except ValueError:
            return 0.0

    def normalize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Takes a raw pandas dataframe and normalizes it to the standard internal structure:
        [date, description, amount, type]
        Cleans extra rows, misaligned tables, and infers missing types.
        """
        # 1. Drop completely empty rows and columns
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        # 2. Find and set headers
        header_idx = self._find_header_row(df)
        if header_idx > 0:
            df.columns = df.iloc[header_idx]
            df = df.iloc[header_idx + 1:].reset_index(drop=True)
            
        # 3. Map columns
        col_map = self._map_columns(df)
        
        # If we couldn't even find date or description, try generic column positions
        if 'date' not in col_map or 'description' not in col_map:
             if len(df.columns) >= 4: # generic fallback
                 df = df.rename(columns={df.columns[0]: 'date', df.columns[2]: 'description', df.columns[-1]: 'amount'})
                 col_map = self._map_columns(df)
        
        if 'date' not in col_map or 'description' not in col_map:
             raise ValueError("Could not confidently identify 'Date' or 'Description' columns in the statement.")
             
        # Extract identified columns
        std_df = pd.DataFrame()
        std_df['date'] = pd.to_datetime(df[col_map['date']], errors='coerce')
        std_df['description'] = df[col_map['description']].astype(str).str.strip()
        
        # 4. Handle Amounts (Single 'amount' vs separate 'debit'/'credit' columns)
        if 'debit' in col_map and 'credit' in col_map:
            std_df['debit'] = df[col_map['debit']].apply(self._clean_amount)
            std_df['credit'] = df[col_map['credit']].apply(self._clean_amount)
            
            # Reconstruct single amount and type
            std_df['amount'] = std_df['debit'].fillna(0) + std_df['credit'].fillna(0)
            std_df['type'] = ['CREDIT' if c > 0 else 'DEBIT' for c in std_df['credit'].fillna(0)]
            
        elif 'amount' in col_map:
            # fillna('') is strictly required before astype(str) because Pandas mixed type Series may retain np.nan as a float object.
            raw_amt_series = df[col_map['amount']].fillna('').astype(str)
            
            # Clean and infer from sign (+/-) if type column is missing
            clean_amts = []
            types = []
            
            for val in raw_amt_series:
                cln = self._clean_amount(val)
                if '+' in val or cln > 0:
                     clean_amts.append(abs(cln))
                     types.append('CREDIT')
                elif '-' in val or val.strip().startswith('(') or cln < 0:
                     clean_amts.append(abs(cln))
                     types.append('DEBIT')
                else:
                     clean_amts.append(abs(cln))
                     types.append('UNKNOWN') # will be inferred later if type mapping exists
            
            std_df['amount'] = clean_amts
            
            if 'type' in col_map:
                std_df['type'] = df[col_map['type']].fillna('').astype(str).str.upper().str.strip()
                # Overwrite UNKNOWNs
                std_df['type'] = std_df.apply(lambda row: 'CREDIT' if 'CR' in row['type'] or 'IN' in row['type'] else 'DEBIT', axis=1)
            else:
                 std_df['type'] = types
                 # Default unknown to debit if unsigned
                 std_df['type'] = std_df['type'].replace('UNKNOWN', 'DEBIT')
        else:
            raise ValueError("Could not identify 'Amount' or 'Debit/Credit' columns.")
            
        # 5. Clean up NaT dates and empty descriptions (removes irregular header/footer metadata)
        std_df = std_df.dropna(subset=['date'])
        std_df = std_df[std_df['description'] != 'nan']
        std_df = std_df[std_df['amount'] > 0] # drop 0 value txns
        
        return std_df.reset_index(drop=True)

    def parse_file(self, content: bytes, filename: str) -> pd.DataFrame:
        """Entry point. Detects file format, reads raw structure, and normalizes it."""
        if filename.endswith('.csv'):
            try:
                df = pd.read_csv(io.StringIO(content.decode('utf-8')), on_bad_lines='skip')
            except UnicodeDecodeError:
                df = pd.read_csv(io.StringIO(content.decode('ISO-8859-1')), on_bad_lines='skip')
        elif filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(content))
        elif filename.endswith('.pdf'):
            df = self._parse_pdf(content)
        else:
            raise ValueError("Unsupported format.")
            
        return self.normalize_dataframe(df)
        
    def _parse_pdf(self, content: bytes) -> pd.DataFrame:
        """Enhanced PDF extraction relying explicitly on pdfplumber for real table data extraction."""
        import pdfplumber
        import io
        
        all_rows = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                if not tables:
                     continue
                
                # Assume the largest structured table is the bank statement table
                # Often the first row is header. We just concatenate everything and let the normalizer figure it out.
                for table in tables:
                     for row in table:
                          if not row or all(cell is None or str(cell).strip() == '' for cell in row):
                              continue
                          # Clean newlines from cells
                          cleaned_row = [str(cell).replace('\n', ' ').strip() if cell is not None else '' for cell in row]
                          all_rows.append(cleaned_row)
                          
        if not all_rows:
            raise ValueError("Could not extract a readable transaction table from the PDF. Scanned PDFs are not supported.")
            
        return pd.DataFrame(all_rows)

parser_service = ParserService()
