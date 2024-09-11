# AliExpress Product Scraper

A simple service for scraping product information from AliExpress.

## Fetch Data

### GET `/item/:id`

**Headers:**  
- `API-Key: API_KEY variable`

**Response:**
```json
{
    "title": "string",
    "description": "string",
    "images": ["string"],
    "skus": [
        {
            "type": "text" | "image",
            "value": "string",
            "src": "string"
        }
    ]
}
```

## Variables

- **API_KEY**: `string` - The API key for authenticating requests.

## Self-Hosting

To self-host the service, you'll need the following:

1. **Node.js 18+**: Make sure Node.js version 18 or higher is installed.
2. **Docker (optional)**: If you prefer to use Docker, ensure Docker is installed.

### Step 1: Clone the repository
```bash
git clone https://github.com/x1xo/AliExpress-Scraper.git
cd AliExpress-Scraper
```

### Step 2: Hosting Options

- **Without Docker**: 
  - Install dependencies and start the service with the command:
    ```bash
    npm install
    npm run start
    ```
  - You can also use **PM2** for process management:
    ```bash
    pm2 start npm --name "AliExpressScraper" -- run start
    ```

- **With Docker**:
  - Build and run the service using Docker:
    ```bash
    docker build -t aliexpress-scraper .
    docker run -d -p 3000:3000 aliexpress-scraper
    ```