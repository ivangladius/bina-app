import argparse
import time
import os
from binance.client import Client
from binance.exceptions import BinanceAPIException
import uuid

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
RESET = '\033[0m'

# Global variables for API keys
API_KEY = os.environ.get('BINANCE_API_KEY')
API_SECRET = os.environ.get('BINANCE_SECRET_KEY')

def get_symbol(base_currency):
    return f"{base_currency.upper()}USDT"

def create_pending_order(client, symbol, amount, top, bottom, quantity=None):
    ticker = client.get_symbol_ticker(symbol=symbol)
    current_price = float(ticker['price'])
    
    use_quantity = quantity is not None
    if use_quantity:
        top_quantity = bottom_quantity = quantity
        amount = quantity * current_price
    else:
        top_quantity = amount / top
        bottom_quantity = amount / bottom

    return {
        'id': str(uuid.uuid4()),
        'currency': symbol.replace('USDT', ''),
        'current_price': current_price,
        'top_limit': top,
        'bottom_limit': bottom,
        'amount': amount,
        'top_quantity': top_quantity,
        'bottom_quantity': bottom_quantity,
        'status': 'PENDING',
        'time': int(time.time() * 1000),
    }

def flexible_range_buy_strategy(client, symbol, amount, top, bottom, quantity=None):
    print(f"\nWatching {symbol} with boundaries: Top ${top:.2f}, Bottom ${bottom:.2f}")
    print("=" * 50)
    
    use_quantity = quantity is not None
    
    while True:
        try:
            ticker = client.get_symbol_ticker(symbol=symbol)
            current_price = float(ticker['price'])
            
            if not use_quantity:
                quantity = amount / current_price
            
            print(f"Top: ${top:.2f} | Current: ${current_price:.2f} | Bottom: ${bottom:.2f}", end='\r')
            
            if current_price <= bottom or current_price >= top:
                order = client.create_order(
                    symbol=symbol,
                    side=client.SIDE_BUY,
                    type=client.ORDER_TYPE_MARKET,
                    quantity=quantity if use_quantity else None,
                    quoteOrderQty=amount if not use_quantity else None
                )
                
                executed_quantity = float(order['executedQty'])
                executed_amount = float(order['cummulativeQuoteQty'])
                
                executed_order = {
                    'id': order['orderId'],
                    'currency': symbol.replace('USDT', ''),
                    'execution_price': executed_amount / executed_quantity,
                    'top_limit': top,
                    'bottom_limit': bottom,
                    'amount': executed_amount,
                    'quantity': executed_quantity,
                    'status': 'FILLED',
                    'time': order['transactTime'],
                    'reason': 'Bottom limit reached' if current_price <= bottom else 'Top limit reached'
                }
                
                print("\n" + "="*50)
                print("TRADE EXECUTED ON TESTNET")
                print("="*50)
                for key, value in executed_order.items():
                    print(f"{key.capitalize()}: {value}")
                print("="*50 + "\n")
                
                return executed_order
            
            time.sleep(1)

        except BinanceAPIException as e:
            print(f"\nAn error occurred: {e}")
            return None

def get_account_balance(client):
    account = client.get_account()
    balances = account['balances']
    return {asset['asset']: float(asset['free']) for asset in balances if asset['asset'] == 'USDT'}

def display_balance(client):
    balances = get_account_balance(client)
    print("\nAccount Balance (USDT):")
    print("=======================")
    if 'USDT' in balances:
        print(f"USDT: {balances['USDT']:.2f}")
    else:
        print("No USDT balance found.")
    print("=======================\n")

def main():
    parser = argparse.ArgumentParser(description="Binance Testnet Tool")
    parser.add_argument("--show-balance", action="store_true", help="Display account balance")
    parser.add_argument("--currency", type=str, help="Base currency (e.g., BTC, ETH)")
    parser.add_argument("--amount", type=float, help="Amount in USDT to buy")
    parser.add_argument("--top", type=float, help="Upper price boundary")
    parser.add_argument("--bottom", type=float, help="Lower price boundary")

    args = parser.parse_args()

    if not API_KEY or not API_SECRET:
        print("Error: BINANCE_TESTNET_API_KEY and BINANCE_TESTNET_SECRET_KEY must be set in the environment.")
        return

    # Initialize Binance client with global API keys
    client = Client(API_KEY, API_SECRET, testnet=True)

    if args.show_balance:
        display_balance(client)
    elif all([args.currency, args.amount, args.top, args.bottom]):
        symbol = get_symbol(args.currency)
        print(f"Strategy parameters:")
        print(f"Trading Pair: {symbol}")
        print(f"Amount to spend: ${args.amount}")
        print(f"Top boundary: ${args.top}")
        print(f"Bottom boundary: ${args.bottom}")
        print("Starting simulation...")
        flexible_range_buy_strategy(client, symbol, args.amount, args.top, args.bottom)
    else:
        parser.print_help()
        print("\nError: For trading strategy, all of --currency, --amount, --top, and --bottom must be provided.")

if __name__ == "__main__":
    main()
