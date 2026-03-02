# Finance Stocks Portfolio

A full-stack stock portfolio tracker where users can sign up/login, create sector-based portfolios (like IT, Healthcare), add stocks using Yahoo suggestions, and view live valuation insights.

## Features
- User authentication (signup/login/logout)
- User-specific portfolios and stocks
- Add stock by name with autocomplete suggestions (ticker auto-selected)
- Live stock data fetched from yfinance
- Portfolio analytics:
  - Top discount opportunities chart
  - Summary cards
  - Stock detail price history chart

## Tech Stack
- Frontend: React, Axios, Recharts
- Backend: Django, Django REST Framework, SQLite
- Data Source: yfinance

## Run Locally
1. Backend:
   - `cd financestocksandportfolio`
   - `python manage.py migrate`
   - `python manage.py runserver`
2. Frontend:
   - `cd Frontend/Financefrontend`
   - `npm install`
   - `npm run dev`

## API Base URL
- `http://127.0.0.1:8000/api/`
