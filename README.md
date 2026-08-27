ProductPulse

A production-deployed e-commerce product analytics platform that turns customer, transaction, product, payment, and experiment data into actionable business insights.

ProductPulse is a full-stack business analytics platform designed to help e-commerce teams understand where revenue comes from, where customers drop off, which products and customer segments perform best, where payment failures create opportunities, and whether product experiments are delivering meaningful improvements.

The platform combines transactional and behavioral data into a centralized decision-support dashboard.

Live Demo

Frontend: https://product-pulse-pink.vercel.app/

API: https://productpulse-1yxk.onrender.com

API Documentation: https://productpulse-1yxk.onrender.com/docs

Business Problem

E-commerce businesses generate large volumes of customer, transaction, product, payment, and behavioral data.

However, raw data does not automatically provide clear answers to important business questions.

ProductPulse brings these signals together to help identify:

Revenue trends and sales performance

Conversion losses across the customer journey

Payment failure and recovery opportunities

High-performing products and categories

Customer purchasing behavior

Acquisition-channel performance

Repeat purchasing patterns

Experiment outcomes and business impact

The goal is to transform raw operational data into decision-oriented business insights.

Business Questions ProductPulse Answers

Revenue

How much revenue is being generated?

How are sales changing over time?

What is the average order value?

How much revenue is generated per purchasing customer?

Conversion

Where are customers dropping out of the purchase journey?

How many visitors progress from product discovery to purchase?

Which devices have stronger or weaker conversion performance?

Which stage of the funnel represents the largest opportunity?

Payments

How many payment attempts fail?

Which payment methods experience the most failures?

What proportion of failed payments can potentially be recovered?

How much revenue could be recovered through improved payment recovery?

Products

Which products generate the most revenue?

Which categories perform best?

Which products generate stronger estimated gross profit?

Which categories have higher or lower gross margins?

Customers

How many customers are purchasing?

Which customer segments are most valuable?

How frequently do customers return to purchase?

Which acquisition channels bring customers into the business?

Experiments

Does the treatment group outperform the control group?

How large is the improvement?

Is the observed improvement statistically significant?

Should the experiment be considered for rollout?

What ProductPulse Provides

Revenue Analytics

Total revenue

Total orders

Average order value

Revenue per customer

Monthly revenue trends

Conversion Analytics

Visitor → product view

Product view → cart

Cart → checkout

Checkout → payment

Payment → purchase

Device-level conversion performance

Payment Analytics

Payment attempts

Successful payments

Failed payments

Payment failure rates

Payment-method performance

Product Analytics

Product performance

Units sold

Revenue

Estimated gross profit

Category-level performance

Gross margin

Customer Analytics

Purchasing customers

Customer segments

Average customer revenue

Repeat purchase rate

Acquisition-channel performance

Experiment Analytics

Control vs treatment performance

Payment recovery rate

Recovered revenue

Absolute lift

Relative lift

Statistical significance

Experiment recommendation

Dashboard Preview

Overview



Conversion Analytics



Payment Analytics



Product Analytics



Customer Analytics



Experiment Analytics



Key Business Insights

ProductPulse converts raw e-commerce data into metrics that can support business decisions.

Revenue Performance

Revenue and order metrics provide a high-level view of overall commercial performance and help identify changes in sales trends.

Funnel Optimization

The conversion funnel helps identify the stages where potential customers are lost, allowing teams to focus optimization efforts on the largest points of friction.

Payment Recovery

Payment analytics highlight failed transactions and recovery opportunities. This allows businesses to quantify the potential value of improving payment recovery.

Product Profitability

Product and category analytics combine sales performance with estimated gross profit and gross margin to provide a broader view than revenue alone.

Customer Value

Customer segmentation, repeat purchase behavior, and acquisition-channel analysis help identify differences in customer value and purchasing behavior.

Experiment Decisions

The experimentation module compares control and treatment groups and evaluates statistical significance, helping distinguish meaningful improvements from random variation.

Experiment Analysis

One of the core business-analysis capabilities of ProductPulse is payment recovery experimentation.

The platform compares:

Control Group
      vs
Treatment Group

and calculates:

Recovery rate

Absolute lift

Relative lift

Z-statistic

P-value

Statistical significance

Experiment recommendation

The resulting analysis can support a business decision such as:

SHIP

or:

DO NOT SHIP YET

This moves the dashboard beyond descriptive reporting toward evidence-based experimentation.

Data Scale

The analytics database currently contains:

Dataset

Records

Users

50,000

Products

5,000

Categories

7

Sessions

150,000

Events

455,558

Orders

50,000

Order Items

124,683

Payments

50,000

Returns

7,457

Experiment Recovery Records

1,484

The dataset is generated deterministically to support reproducible analytics development and testing.

Data Model

The platform works with interconnected business entities including:

Users
  |
  +---- Sessions
  |       |
  |       +---- Events
  |
  +---- Orders
          |
          +---- Order Items
          |
          +---- Payments
          |
          +---- Returns

Products
  |
  +---- Categories

Experiments
  |
  +---- Experiment Assignments
  |
  +---- Payment Recovery Records

This structure allows business metrics to be analyzed across customers, products, transactions, payments, and behavioral events.

Technology Stack

ProductPulse is implemented as a full-stack analytics application.

Frontend

Next.js

React

TypeScript

Tailwind CSS

Recharts

Lucide Icons

Backend

Python

FastAPI

SQLAlchemy

PostgreSQL

Psycopg

Data & Analytics

PostgreSQL

SQL analytics

Pandas

NumPy

Faker

Deterministic synthetic data generation

Infrastructure

Vercel — frontend deployment

Render — backend deployment

Supabase — managed PostgreSQL

GitHub — source control

Architecture



ProductPulse follows a separated frontend, backend, and database architecture:

                         ProductPulse
                              |
                +-------------+-------------+
                |                           |
                v                           v
        Next.js Frontend              FastAPI Backend
             Vercel                      Render
                |                           |
                | HTTPS API                 |
                +------------+--------------+
                             |
                             v
                    Supabase PostgreSQL
                             |
             +---------------+---------------+
             |               |               |
             v               v               v
           Events         Orders         Payments
             |               |               |
             +---------------+---------------+
                             |
                             v
                    Analytics Services
                             |
                             v
                     Business Insights

API

The FastAPI backend exposes analytics endpoints including:

GET /api/health
GET /api/overview
GET /api/revenue
GET /api/funnel
GET /api/devices
GET /api/payments
GET /api/categories
GET /api/products
GET /api/acquisition
GET /api/customer-segments
GET /api/repeat-rate
GET /api/experiment
GET /api/experiment/statistics

Interactive API documentation:

https://productpulse-1yxk.onrender.com/docs

Local Development

Prerequisites

Python 3.11+

Node.js 18+

PostgreSQL

Git

Backend

From the project root:

python -m venv .venv

Activate the environment.

Windows:

.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r backend/requirements.txt

Create a .env file in the project root:

DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/productpulse

Start the API:

python -m uvicorn backend.app.main:app --reload

API:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs

Frontend

cd frontend
npm install

Create:

frontend/.env.local

with:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

Run:

npm run dev

Open:

http://localhost:3000

Production Deployment

ProductPulse uses a separated production architecture:

GitHub
  |
  +---- frontend/ ----> Vercel
  |
  +---- backend/ -----> Render
                         |
                         v
                    Supabase
                    PostgreSQL

The frontend communicates with the backend through HTTPS.

Production database credentials are configured through deployment environment variables and are not committed to source control.

Testing & CI

ProductPulse includes automated backend API tests covering:

Health checks

Revenue analytics

Overview metrics

Conversion funnel

Device analytics

Payment analytics

Product endpoints

Query parameter validation

Customer analytics

Experiment analytics

Experiment statistics

The backend test suite currently contains 16 automated tests.

GitHub Actions is configured to run automated checks on pushes and pull requests.

GitHub Push / Pull Request
          |
          v
    ProductPulse CI
          |
    +-----+------+
    |            |
    v            v
Backend Tests   Frontend Checks
   pytest       lint / build

Security

Secrets are intentionally excluded from source control.

The repository ignores:

.env
.env.local-backup
*.dump
node_modules/
.next/
__pycache__/

Production database credentials are configured through the hosting provider's environment-variable system.

Engineering Highlights

Although ProductPulse is primarily positioned as a business analytics project, it was implemented as a complete working product rather than a static visualization.

Key areas include:

Business metric design

Relational data modeling

SQL-based analytics

REST API development

Service-layer architecture

Statistical experiment analysis

Reproducible synthetic data generation

Production PostgreSQL deployment

Cloud database migration

Environment-based configuration

Production frontend/backend separation

Automated backend testing

GitHub Actions CI

Future Improvements

Potential future iterations include:

Authentication and role-based access control

Date-range filtering

Custom dashboard configuration

Automated anomaly detection

Scheduled reports

Advanced cohort analysis

Retention analysis

Customer lifetime value modeling

Automated alerts

Expanded CI/CD test coverage

Author

Asmit Sharma

Built as a full-stack product analytics engineering project focused on turning e-commerce data into actionable business insights.