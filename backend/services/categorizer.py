import pandas as pd
import re

class TransactionCategorizer:
    def __init__(self):
        # Mapping semantic keywords to high-level categories
        # Order matters! Place specific exact matches before generic ones.
        self.category_rules = {
            'Salary': [r'\bsal\b', r'\bsalary\b', r'payroll', r'stipend', r'wages', r'remuneration\b'],
            'Investment': [r'zerodha', r'groww', r'upstox', r'mutual', r'angel one', r'sip\b', r'hdfc mf', r'nippon', r'ipo\b', r'\bfd\b', r'fixed deposit'],
            'Insurance': [r'lic\b', r'insurance', r'policybazaar', r'premium', r'max life', r'hdfc life'],
            'EMI': [r'\bemi\b', r'loan', r'bajaj finance', r'home credit', r'muthoot'],
            'Utilities': [r'electricity', r'water bill', r'gas\b', r'broadband', r'jio', r'airtel', r'vi\b', r'recharge', r'biller', r'bescom'],
            'Transport': [r'uber', r'ola', r'rapido', r'irctc', r'redbus', r'makemytrip', r'goibibo', r'petrol', r'fuel', r'indianoil', r'hpcl', r'bpcl', r'flight', r'indigo', r'fastag'],
            'Food & Dining': [r'zomato', r'swiggy', r'restaurant', r'cafe', r'starbucks', r'mcdonalds', r'dominos', r'kfc', r'pizza', r'dining'],
            'Grocery': [r'big bazaar', r'dmart', r'reliance fresh', r'blinkit', r'zepto', r'instamart', r'grocery', r'supermarket', r'milk', r'dairy'],
            'Entertainment': [r'netflix', r'amazon prime', r'prime video', r'hotstar', r'spotify', r'pvr', r'bookmyshow', r'cinema', r'movie', r'club', r'pub\b'],
            'Shopping': [r'amazon', r'flipkart', r'myntra', r'zara', r'h&m', r'ajio', r'apparel', r'shopping', r'mall', r'store', r'retail'],
            'ATM Withdrawal': [r'\batm\b', r'cash withdrawal', r'cash wdl', r'wdl\b'],
            'Credit Card Bill': [r'credit card', r'cc bill', r'cred club', r'cred\b', r'sbi card'],
            'Transfers': [r'upi', r'neft', r'rtgs', r'imps', r'transfer to', r'transfer from', r'self transfer', r'sent to', r'received from']
        }

        # Compile regexes ahead of time for performance
        self.compiled_rules = {
            cat: [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
            for cat, patterns in self.category_rules.items()
        }

    def categorize_transaction(self, description: str, txn_type: str, amount: float) -> str:
        """Determines the most likely category based on description heuristics."""
        desc_lower = str(description).lower()

        # 1. Regex rule matching
        for category, regex_list in self.compiled_rules.items():
            for regex in regex_list:
                if regex.search(desc_lower):
                    # Edge Cases handling
                    if category == 'Transfers' and txn_type == 'CREDIT' and amount > 20000:
                        # Large transfer IN might be salary if unmarked
                        pass
                    return category
                    
        # 2. Heuristics fallback based on amount/type
        if txn_type == 'CREDIT':
            if amount > 15000:
                return 'Salary' # Speculative Fallback for unlabelled large incoming
            return 'Other Income'
            
        else: # DEBIT
            if amount < 500:
                return 'Food & Dining' # Generic micro-transaction guess
            return 'Other Expenses'

    def categorize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Takes a standardized [date, description, amount, type] dataframe and appends 'category'."""
        
        # Apply categorization
        df['category'] = df.apply(
            lambda row: self.categorize_transaction(row['description'], row['type'], row['amount']), 
            axis=1
        )
        return df

categorizer_service = TransactionCategorizer()
