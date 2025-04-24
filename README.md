# MyShop

MyShop is a simple e-commerce application built with Angular for the frontend and a placeholder backend folder for future server-side development.

## Features

- **Frontend**: Built with Angular, showcasing a product list, product cards, and a cart system.
- **Backend**: Placeholder folder for future backend implementation.

## Project Structure

The project is organized as follows:

```
my-shop/
├── backend/                      # Placeholder for backend implementation
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts          # Root component
│   │   │   ├── app.config.ts             # Application configuration
│   │   │   ├── app.routes.ts             # Application routes
│   │   │   ├── features/
│   │   │   │   └── cart/
│   │   │   │       └── cart.component.ts         # Cart component
│   │   │   ├── home/                     # Home module
│   │   │   │   └── product-list/
│   │   │   │       ├── product-list.component.ts  # Product list component
│   │   │   │       └── product-card/
│   │   │   │           └── product-card.component.ts  # Product card component
│   │   │   ├── shared/
│   │   │       ├── header/
│   │   │       │   └── header.component.ts  # Header component
│   │   │       ├── primary-button/
│   │   │       │   └── primary-button.component.ts  # Reusable button component
│   │   │       └── models/
│   │   │           └── products.model.ts  # Product model
```

## Technologies Used

### Frontend

- **Angular**: Framework for building the application.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **TypeScript**: Strongly typed programming language for Angular development.

### Backend

- Currently empty. Placeholder for future backend implementation.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Angular CLI](https://angular.io/cli)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd my-shop
   ```

2. Navigate to the `frontend` folder and install dependencies:

   ```bash
   cd frontend
   npm install
   ```

### Development Server

Run the development server for the frontend:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The app will automatically reload if you make changes to the source files.

### Building the Project

To build the frontend project for production:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

### Running Unit Tests

To execute unit tests for the frontend:

```bash
ng test
```

## Components Overview

### ProductCardComponent

- Displays product details such as title, price, image, and stock status.
- Includes an "Add to Cart" button.

### ProductListComponent

- Renders a list of products using the `ProductCardComponent`.

### CartComponent

- Displays the items added to the cart.

### HeaderComponent

- Displays the application header with a cart button.

### PrimaryButtonComponent

- A reusable button component with customizable labels and click events.

## Future Plans for Backend

The `backend` folder is currently empty but will be used for server-side development. Potential technologies include:

- **Node.js** with **Express** for REST API development.
- **MongoDB** or **PostgreSQL** for database management.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Fake Store API](https://fakestoreapi.com/) for product data.
- [Angular](https://angular.io/) for the framework.
- [Tailwind CSS](https://tailwindcss.com/) for styling.