# Broker-Collection-Scraper
Real Estate Broker Collection Scraper
data source [real estate broker collection](https://eservicesredp.rega.gov.sa/auth/queries/Brokerage)

## Description:
This project uses Puppeteer to scrape data from a website and store it in a JSON file. It allows you to automate data extraction, which can be customized based on specific parameters.

## Prerequisites:
Before running this project, ensure the following tools are installed:

- [Node.js](https://nodejs.org/)

## Setup Instructions:

**In Terminal**

1. **Clone the Repository**:
   If you haven't already cloned the project, you can do so by running the following command in your terminal:
   ```bash
   https://github.com/MahmuedAlardawi/Broker-Collection-Scraper.git

2. **Enter Project and install dependances**:
   ```bash
   cd broker_collection_assignment
   npm install

3. **Run Program**:
   ```bash
   node scraper.js

## Parametrs
In the scraper.js file you can modify the parameters:
  ```javascript
  const license = 0
  const mediator = 0
  const max_records = 200 // eneter 'Infinity' to scrape all available recoreds
  const filePath = `${licenses_en[license]}-${max_records}_recoreds.json`;
