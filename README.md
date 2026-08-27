# ProductPulse

> Production-ready e-commerce product analytics platform for understanding revenue, conversion, payments, customers, products, and experiment performance.

ProductPulse is a full-stack analytics platform designed to transform raw e-commerce event and transaction data into actionable business insights.

It combines a PostgreSQL analytics layer, FastAPI backend, and Next.js dashboard to provide a centralized view of product and business performance.

## Live Demo

- **Frontend:** https://product-pulse-pink.vercel.app/
- **API:** https://productpulse-1yxk.onrender.com
- **API Docs:** https://productpulse-1yxk.onrender.com/docs

## What ProductPulse Provides

### Revenue Analytics
- Total revenue
- Total orders
- Average order value
- Revenue per customer
- Monthly revenue trends

### Conversion Analytics
- Visitor → product view
- Product view → cart
- Cart → checkout
- Checkout → payment
- Payment → purchase
- Device-level conversion performance

### Payment Analytics
- Payment attempts
- Successful payments
- Failed payments
- Payment failure rates
- Payment-method performance

### Product Analytics
- Product performance
- Units sold
- Revenue
- Estimated gross profit
- Category-level performance
- Gross margin

### Customer Analytics
- Purchasing customers
- Customer segments
- Average customer revenue
- Repeat purchase rate
- Acquisition-channel performance

### Experiment Analytics
- Control vs treatment performance
- Payment recovery rate
- Recovered revenue
- Absolute lift
- Relative lift
- Statistical significance
- Experiment recommendation

---

## Architecture

![ProductPulse Architecture](docs/images/architecture.png)

```text
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
```

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- Lucide Icons

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Psycopg

### Data & Analytics
- PostgreSQL
- SQL analytics
- Pandas
- NumPy
- Faker
- Deterministic synthetic dataset generation

### Infrastructure
- Vercel — frontend deployment
- Render — backend deployment
- Supabase — managed PostgreSQL
- GitHub — source control

---

## Project Structure

```text
ProductPulse/
│
├── analytics/
│   ├── generate_data.py
│   ├── generate_events.py
│   ├── generate_experiment.py
│   └── generate_transactions.py
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── database/
│   │   └── services/
│   │
│   ├── requirements.txt
│   └── __init__.py
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   └── next.config.ts
│
├── sql/
│   ├── 01_schema.sql
│   ├── 02_core_analytics.sql
│   └── 03_product_analytics.sql
│
├── render.yaml
├── .env.example
└── .gitignore
```

## Data Scale

The production analytics database currently contains:

| Dataset | Records |
|---|---:|
| Users | 50,000 |
| Products | 5,000 |
| Categories | 7 |
| Sessions | 150,000 |
| Events | 455,558 |
| Orders | 50,000 |
| Order Items | 124,683 |
| Payments | 50,000 |
| Returns | 7,457 |
| Experiment Recovery Records | 1,484 |

The dataset is generated deterministically for reproducible analytics development and testing.

---

## API

The FastAPI backend exposes analytics endpoints including:

```text
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
```

Interactive API documentation is available through FastAPI Swagger UI:

https://productpulse-1yxk.onrender.com/docs

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Git

### Backend

From the project root:

```bash
python -m venv .venv
```

Activate the environment.

Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/productpulse
```

Start the API:

```bash
python -m uvicorn backend.app.main:app --reload
```

API:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### Frontend

```powershell
cd frontend
npm install
```

Create:

```text
frontend/.env.local
```

with:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Run:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Production Deployment

ProductPulse uses a separated production architecture:

```text
GitHub
  |
  +---- frontend/ ----> Vercel
  |
  +---- backend/ -----> Render
                         |
                         v
                    Supabase
                    PostgreSQL
```

The frontend communicates with the backend through HTTPS.

Database credentials are stored as deployment environment variables and are not committed to the repository.

---

## Security

Secrets are intentionally excluded from source control.

The repository ignores:

```text
.env
.env.local-backup
*.dump
node_modules/
.next/
__pycache__/
```

Production database credentials are configured through the hosting provider's environment-variable system.

---

## Engineering Highlights

ProductPulse was built as a full-stack analytics system rather than a static dashboard.

Key engineering areas include:

- Relational data modeling
- SQL-based analytics
- REST API design
- Service-layer separation
- Type-safe frontend API integration
- Production PostgreSQL deployment
- Cloud database migration
- Environment-based configuration
- CORS configuration
- Production frontend/backend separation
- Reproducible synthetic data generation
- Experiment analysis and statistical evaluation

---

## Future Improvements

Potential future iterations include:

- Authentication and role-based access control
- Date-range filtering
- Custom dashboard configuration
- Automated anomaly detection
- Scheduled reports
- Advanced cohort analysis
- Retention analysis
- Customer lifetime value modeling
- Automated alerts
- CI/CD test pipelines

---

## Author

**Asmit Sharma**

Built as a full-stack product analytics engineering project.
