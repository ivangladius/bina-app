from fastapi import FastAPI, HTTPException, Query, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict
from binance.client import Client
from binance.exceptions import BinanceAPIException
import trade as main # Import the main module with trading logic
import uuid
from concurrent.futures import ThreadPoolExecutor
import asyncio
from fastapi.responses import FileResponse, HTMLResponse
import os
import database
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from jose import jwt
import secrets
from auth import create_access_token, verify_token, verify_password, LoginCredentials

# Add these lines after the existing global variables
SECRET_KEY = os.environ.get("SECRET_KEY", "")  # Replace with a secure secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Add this line
executor = ThreadPoolExecutor()

# Add this function to create a global dependency
def get_current_user(token: dict = Depends(verify_token)):
    return token

# Create the FastAPI app without global dependencies
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lists to store pending and filled orders
pending_orders: List[Dict] = []
filled_orders: List[Dict] = []

# Variable to store the total amount used in trades
total_trade_amount: float = 0.0

class TradeParams(BaseModel):
    currency: str
    top: float
    bottom: float
    amount: Optional[float] = None
    quantity: Optional[float] = None

@app.get("/balance", dependencies=[Depends(get_current_user)])
async def get_balance():
    client = Client(main.API_KEY, main.API_SECRET, testnet=False)
    balances = main.get_account_balance(client)
    binance_balance = balances.get('USDT', 0)
    available_balance = binance_balance - total_trade_amount
    return {"balance": available_balance}

@app.post("/trade", dependencies=[Depends(get_current_user)])
async def start_trade(params: TradeParams):
    global total_trade_amount, pending_orders, filled_orders
    
    if params.amount is None and params.quantity is None:
        raise HTTPException(status_code=400, detail="Either amount or quantity must be provided")
    
    client = Client(main.API_KEY, main.API_SECRET, testnet=False)
    symbol = main.get_symbol(params.currency)
    
    # Calculate the amount to subtract from the balance
    amount_to_subtract = params.amount if params.amount is not None else params.quantity * float(client.get_symbol_ticker(symbol=symbol)['price'])
    
    # Add the amount to the total trade amount
    total_trade_amount += amount_to_subtract
    
    # Create a pending order
    pending_order = main.create_pending_order(
        client, symbol, params.amount, params.top, params.bottom, params.quantity
    )
    pending_orders.append(pending_order)
    
    async def run_trade():
        try:
            trade_amount = params.amount if params.quantity is None else None
            trade_quantity = params.quantity if params.amount is None else None
            executed_order = await asyncio.get_event_loop().run_in_executor(
                executor,
                main.flexible_range_buy_strategy,
                client, symbol, trade_amount, params.top, params.bottom, trade_quantity
            )
            
            if executed_order:
                # Add the symbol to the executed_order
                executed_order['symbol'] = symbol
                
                # Remove the pending order
                try:
                    pending_orders.remove(pending_order)
                except ValueError:
                    print(f"Pending order {pending_order['id']} not found in the list")
                
                # Add the executed order to the filled_orders list
                filled_orders.append(executed_order)
                
                # Insert the executed order into the database
                try:
                    database.insert_filled_order(executed_order)
                except Exception as db_error:
                    print(f"Error inserting order into database: {str(db_error)}")
                
                print(f"Trade executed successfully: {executed_order['id']}")
            else:
                # Remove the pending order if execution failed
                try:
                    pending_orders.remove(pending_order)
                except ValueError:
                    print(f"Pending order {pending_order['id']} not found in the list")
                print("Trade execution failed")
        except Exception as e:
            # Remove the pending order if an exception occurred
            try:
                pending_orders.remove(pending_order)
            except ValueError:
                print(f"Pending order {pending_order['id']} not found in the list")
            print(f"An error occurred: {str(e)}")
    
    # Start the trade operation in the background
    asyncio.create_task(run_trade())
    
    return {"message": "Trade started successfully", "pending_order_id": pending_order['id'], "total_trade_amount": total_trade_amount}

@app.get("/pending_orders", dependencies=[Depends(get_current_user)])
async def get_pending_orders(limit: int = Query(10, description="Number of recent pending orders to retrieve")):
    recent_orders = pending_orders[-limit:]
    return {"pending_orders": recent_orders}

@app.get("/filled_orders", dependencies=[Depends(get_current_user)])
async def get_filled_orders(limit: int = Query(10, ge=1, le=100)):
    return database.get_filled_orders(limit)

@app.get("/candles", dependencies=[Depends(get_current_user)])
async def get_candle_data(pair: str = Query(...), interval: str = Query(default="1h"), limit: int = Query(default=100)):
    try:
        # Remove slash if present and convert to uppercase
        formatted_pair = pair.replace("/", "").upper()
        
        client = Client(main.API_KEY, main.API_SECRET, testnet=False)
        
        # Try to get klines, if it fails, try adding 'T' for USDT pairs
        try:
            klines = client.get_klines(symbol=formatted_pair, interval=interval, limit=limit)
        except BinanceAPIException:
            formatted_pair += "T"
            klines = client.get_klines(symbol=formatted_pair, interval=interval, limit=limit)
        
        candle_data = []
        for k in klines:
            candle = {
                "timestamp": k[0],
                "open": float(k[1]),
                "high": float(k[2]),
                "low": float(k[3]),
                "close": float(k[4]),
                "volume": float(k[5]),
            }
            candle_data.append(candle)
        
        return candle_data
    except BinanceAPIException as e:
        raise HTTPException(status_code=400, detail=f"Invalid pair or Binance API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.get("/price/{coin}", dependencies=[Depends(get_current_user)])
async def get_coin_price(coin: str):
    try:
        # Convert to uppercase and add USDT
        formatted_symbol = f"{coin.upper()}USDT"
        
        client = Client(main.API_KEY, main.API_SECRET, testnet=False)
        
        ticker = client.get_symbol_ticker(symbol=formatted_symbol)
        
        return {
            "coin": coin.upper(),
            "price": float(ticker['price'])
        }
    except BinanceAPIException as e:
        raise HTTPException(status_code=400, detail=f"Invalid coin or Binance API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.get("/order/{order_id}", dependencies=[Depends(get_current_user)])
async def get_order(order_id: str):
    order = next((order for order in pending_orders if order['id'] == order_id), None)
    if order:
        return {"status": "pending", "order": order}
    
    order = next((order for order in filled_orders if order['id'] == order_id), None)
    if order:
        return {"status": "filled", "order": order}
    
    raise HTTPException(status_code=404, detail="Order not found")

@app.delete("/order/{order_id}", dependencies=[Depends(get_current_user)])
async def delete_order(order_id: str, refund_amount: float = Query(..., description="Amount to be refunded")):
    global pending_orders, total_trade_amount
    
    # Search and remove from pending orders
    pending_order = next((order for order in pending_orders if order['id'] == order_id), None)
    if pending_order:
        pending_orders = [order for order in pending_orders if order['id'] != order_id]
        # Subtract the refund amount from the total trade amount
        total_trade_amount -= refund_amount
        return {"message": "Pending order deleted successfully", "order_id": order_id, "refunded_amount": refund_amount}
    
    # Try to delete from filled orders in the database
    if database.delete_filled_order(order_id):
        # For filled orders, we don't adjust the total_trade_amount
        return {"message": "Filled order deleted successfully", "order_id": order_id}
    
    raise HTTPException(status_code=404, detail="Order not found")

@app.delete("/filled_order/{order_id}", dependencies=[Depends(get_current_user)])
async def delete_filled_order(order_id: str):
    global filled_orders
    
    # Try to delete from filled orders in memory
    filled_order = next((order for order in filled_orders if order['id'] == order_id), None)
    if filled_order:
        filled_orders = [order for order in filled_orders if order['id'] != order_id]
    
    # Try to delete from the database
    if database.delete_filled_order(order_id):
        return {"message": "Filled order deleted successfully from database", "order_id": order_id}
    else:
        raise HTTPException(status_code=404, detail="Filled order not found in database")

# Login route without authentication
@app.post("/login")
async def login(password: str = Form(...)):
    if verify_password(password):
        token = create_access_token(data={"sub": "user"})
        return {"token": token}
    else:
        raise HTTPException(status_code=401, detail="Incorrect password")

if __name__ == "__main__":
    database.init_db()  # Initialize the database
    import uvicorn
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="key.pem",  # Path to your SSL key
        ssl_certfile="cert.pem",  # Path to your SSL certificate
        reload=True
    )
