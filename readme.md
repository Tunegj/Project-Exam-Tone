# MIRAE – Online Fashion & Lifestyle Store

MIRAE is a responsive e-commerce web application built for the Noroff Project Exam. It allows users to browse products, view details, add items to a cart, and complete a mock checkout flow using data from the Noroff Online Shop API.

📸 Screenshot
Add a screenshot of your project here (you can drag an image into GitHub or link it).

Project Screenshot
![MIRAE Screenshot](./assets/Skjermbilde%202025-12-07%20210741.png)

🛠️ Built With

- **HTML5** – semantic structure and accessible markup
- **CSS3** – custom responsive layout, component-based styling, design tokens
- **JavaScript (ES Modules)** – vanilla JS with modular architecture
- **Noroff Online Shop API** – product data (title, price, image, tags, etc.)
- **LocalStorage** – user profile, auth token mock, cart, and orders
- **Figma** – high-fidelity desktop and mobile prototypes
- **GitHub Pages** – deployment

## ✨ Features

- Product listing page with cards, tags, and pricing
- Product detail pages with full information and “Add to cart”
- Cart page with quantity updates, remove, and totals
- Checkout page with:
  - Delivery details
  - Billing address sync (“Same as delivery”)
  - Payment details (front-end validation only, no real payments)
- Success page showing order summary and order ID
- Register / Login with basic local “auth” and form validation
- Search field wired to products page with query parameter
- Responsive header with:
  - Desktop navigation
  - Mobile hamburger menu
  - Dynamic cart count
  - Auth link that changes between **“Log in / Register”** and **“Log out”**
- Accessible form errors and focus management

---

## 🔑 Test Login Details (For Examiner)

The application uses `localStorage` for user and auth handling only.  
A test user is automatically created for you when the app runs (if no user exists):

**Test Account**

- **Email:** `admin@stud.noroff.no`
- **Password:** `admin1234`

This account can be used to:

- Log in to the site
- Access the checkout page (checkout is protected and requires login)

---

📦 Installation
Follow these steps to get a copy of the project running locally:

Clone the repository: bash git clone https://github.com/Tunegj/Project-Exam-Tone.git

Open the repository: bash cd Project-Exam-Tone

Run Live Server
npx serve .

License
MIT License
“No license (educational)”

Contact
Student: Tone Gjerde
GitHub: https://github.com/tunegj

Project Repository: https://github.com/tunegj/Project-Exam-Tone

Live Demo: https://tunegj.github.io/Project-Exam-Tone/
