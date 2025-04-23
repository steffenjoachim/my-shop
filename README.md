# MyShop

MyShop is a simple e-commerce application built with Angular. It showcases a product list with individual product cards, allowing users to view product details and add items to their cart.

## Features

- **Product List**: Displays a list of products with their title, price, image, and stock status.
- **Product Card**: Each product is displayed in a card format with an "Add to Cart" button.
- **Header**: Includes a header with a cart button.
- **Dynamic Stock Status**: Shows stock availability with color-coded indicators (green for in-stock, red for out-of-stock).

## Project Structure

The project is organized as follows:

```
src/
├── app/
│   ├── app.component.ts          # Root component
│   ├── app.config.ts             # Application configuration
│   ├── app.routes.ts             # Application routes
│   ├── features/
│   │   └── product-list/
│   │       ├── product-list.component.ts  # Product list component
│   │       └── product-card/
│   │           └── product-card.component.ts  # Product card component
│   ├── shared/
│       ├── header/
│       │   └── header.component.ts  # Header component
│       ├── primary-button/
│       │   └── primary-button.component.ts  # Reusable button component
│       └── models/
│           └── products.model.ts  # Product model
```

## Technologies Used

- **Angular**: Framework for building the application.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **TypeScript**: Strongly typed programming language for Angular development.

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

2. Install dependencies:

   ```bash
   npm install
   ```

### Development Server

Run the development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The app will automatically reload if you make changes to the source files.

### Building the Project

To build the project for production:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

### Running Unit Tests

To execute unit tests:

```bash
ng test
```

## Components Overview

### ProductCardComponent

- Displays product details such as title, price, image, and stock status.
- Includes an "Add to Cart" button.

### ProductListComponent

- Renders a list of products using the `ProductCardComponent`.

### HeaderComponent

- Displays the application header with a cart button.

### PrimaryButtonComponent

- A reusable button component with customizable labels and click events.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Fake Store API](https://fakestoreapi.com/) for product data.
- [Angular](https://angular.io/) for the framework.
- [Tailwind CSS](https://tailwindcss.com/) for styling.
