\# ProductPulse



> Production-ready e-commerce product analytics platform for understanding revenue, conversion, payments, customers, products, and experiment performance.



ProductPulse is a full-stack analytics platform designed to transform raw e-commerce event and transaction data into actionable business insights.



It combines a PostgreSQL analytics layer, FastAPI backend, and Next.js dashboard to provide a centralized view of product and business performance.



\## Live Demo



\- Frontend: https://product-pulse-pink.vercel.app/

\- API: https://productpulse-1yxk.onrender.com

\- API Docs: https://productpulse-1yxk.onrender.com/docs



\## What ProductPulse Provides



\### Revenue Analytics

\- Total revenue

\- Total orders

\- Average order value

\- Revenue per customer

\- Monthly revenue trends



\### Conversion Analytics

\- Visitor → product view

\- Product view → cart

\- Cart → checkout

\- Checkout → payment

\- Payment → purchase

\- Device-level conversion performance



\### Payment Analytics

\- Payment attempts

\- Successful payments

\- Failed payments

\- Payment failure rates

\- Payment-method performance



\### Product Analytics

\- Product performance

\- Units sold

\- Revenue

\- Estimated gross profit

\- Category-level performance

\- Gross margin



\### Customer Analytics

\- Purchasing customers

\- Customer segments

\- Average customer revenue

\- Repeat purchase rate

\- Acquisition-channel performance



\### Experiment Analytics

\- Control vs treatment performance

\- Payment recovery rate

\- Recovered revenue

\- Absolute lift

\- Relative lift

\- Statistical significance

\- Experiment recommendation



\---



\# Architecture



```text

&#x20;                        ProductPulse

&#x20;                             |

&#x20;               +-------------+-------------+

&#x20;               |                           |

&#x20;               v                           v

&#x20;       Next.js Frontend              FastAPI Backend

&#x20;            Vercel                      Render

&#x20;               |                           |

&#x20;               | HTTPS API                 |

&#x20;               +------------+--------------+

&#x20;                            |

&#x20;                            v

&#x20;                   Supabase PostgreSQL

&#x20;                            |

&#x20;            +---------------+---------------+

&#x20;            |               |               |

&#x20;            v               v               v

&#x20;          Events         Orders         Payments

&#x20;            |               |               |

&#x20;            +---------------+---------------+

&#x20;                            |

&#x20;                            v

&#x20;                   Analytics Services

&#x20;                            |

&#x20;                            v

&#x20;                    Business Insights

