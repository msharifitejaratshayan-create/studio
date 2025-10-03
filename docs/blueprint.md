# **App Name**: DataLens Dashboard

## Core Features:

- CSV Upload and Parsing: Allow users to upload a CSV file, parse it, and display the data in a table format.
- Data Table Display: Display the CSV data in a responsive table with dynamic columns based on the CSV headers.
- Sorting: Enable sorting of columns by clicking on the column headers (ascending/descending).
- Filtering and Searching: Implement a global search box to filter rows by any column and column-specific filters (dropdown or text search).
- Pagination: Paginate the table if the number of rows exceeds 50 to improve performance and UI.
- Data Highlighting Tool: Use the IsAnomalous field from the CSV (if present) as a tool. Use AI to help decide if this IsAnomalous information should impact the output. Use highlighting on specific rows based on a condition (e.g., IsAnomalous=True).
- Metadata Display: Display CSV metadata (number of rows, columns) to provide users with an overview of the dataset.

## Style Guidelines:

- Primary color: Soft blue (#77B5FE) for a calm and professional feel.
- Background color: Light gray (#F0F4F8) for a clean, unobtrusive backdrop.
- Accent color: Darker blue (#3F83F8) for interactive elements and highlights.
- Body and headline font: 'Inter', a sans-serif font, will be used for both headlines and body text, to maintain a modern, machined, neutral aesthetic.
- Use simple, modern icons from a set like Feather or Font Awesome for clarity and ease of use.
- Use a clean, grid-based layout with sufficient padding and margins for readability. Ensure responsiveness for various screen sizes using Tailwind's responsive utilities.
- Implement subtle animations and transitions for interactive elements (e.g., sorting, filtering) to provide feedback and improve the user experience.