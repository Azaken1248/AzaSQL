# AzaSQL

AzaSQL is a web-based SQL terminal and simulator designed to provide an interactive environment for executing SQL commands directly in the browser. It features a terminal-like interface, syntax highlighting, and integrates with AI for an enhanced user experience.

### Features
* **SQL in the Browser**: Execute SQL queries and commands directly in your web browser using `sql.js`.
* **Terminal Interface**: The application provides a full-featured terminal powered by `xterm.js` for a familiar command-line experience.
* **Syntax Highlighting**: Code syntax is highlighted using `prismjs` to improve readability.
* **Interactive Code Editor**: An easy-to-use code editor is provided by `react-simple-code-editor`.
* **Dependencies**: The project also includes `firebase` for backend services and `axios` for API calls.

### Tech Stack
* **Frontend**: React, TypeScript, and Vite
* **Styling**: TailwindCSS
* **SQL Engine**: `sql.js`
* **Terminal**: `xterm` and `xterm-addon-fit`
* **API Calls**: `axios`
* **Backend Services**: Firebase
* **AI**: `@google/generative-ai`

### Getting Started

To set up the project locally, follow these steps.

#### Prerequisites

Make sure you have Node.js installed on your machine.

#### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/azaken1248/azasql.git](https://github.com/azaken1248/azasql.git)
    cd azaken1248/azasql/AzaSQL-c63a54636169905580ba7edeaa3a5bbacff81af0/
    ```
2.  Install the dependencies using npm or pnpm:
    ```bash
    npm install
    # or
    pnpm install
    ```

#### Running the Project

To start the development server:

```bash
npm run dev
```

This will run the app in development mode. Open http://localhost:5173 to view it in your browser.

#### Building the project

```bash
npm run build
```

This command builds the app for production to the `dist` folder.


### Contributing

Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

### License

**MIT License**

Copyright (c) 2025 Azaken1248

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
