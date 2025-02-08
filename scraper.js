const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeWebsite(license, mediator, max_recoreds, filePath) {
    console.log('License:', license);
    console.log('Mediator:', mediator);
    console.log('Max number of recoreds:', max_recoreds, '\n');


    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const page = await browser.newPage();
    
    // Navigate to the target page
    await page.goto('https://eservicesredp.rega.gov.sa/auth/queries/Brokerage');


    // Feild 1

    // License type box
    await page.waitForSelector('.sc-fpSrms.jwLulP.dgaui_dropdownContainer');
    await page.click('.sc-fpSrms.jwLulP.dgaui_dropdownContainer .placeholder');

    // License type selector
    await page.waitForSelector('.sc-gJhJTp.iBavsj.dgaui.dgaui_dropdownItem');
    // Use page.evaluate() to find the option by its text and click it
    await page.evaluate((license) => {
        const options = Array.from(document.querySelectorAll('.sc-gJhJTp.iBavsj.dgaui.dgaui_dropdownItem'));
        const optionToClick = options.find(option => option.textContent.trim() === license);
        if (optionToClick) {
            optionToClick.click();
        }
    }, license);
    

    // Feild 2

    // Mediator type box
    await page.waitForSelector('.sc-fpSrms.jwLulP.dgaui_dropdownContainer');
    await page.click('.sc-fpSrms.jwLulP.dgaui_dropdownContainer .placeholder');

    // Mediator type selector
    await page.waitForSelector('.sc-gJhJTp.iBavsj.dgaui.dgaui_dropdownItem');
    await page.evaluate((mediator) => {
        const options = Array.from(document.querySelectorAll('.sc-gJhJTp.iBavsj.dgaui.dgaui_dropdownItem'));
        const optionToClick = options.find(option => option.textContent.trim() === mediator);
        if (optionToClick) {
            optionToClick.click();
        }
    }, mediator);

    
    // Wait 1s
    await new Promise(r => setTimeout(r, 1000));


    // Submit button
    await page.waitForSelector('.bottomSubmitSection');
    await page.click('.bottomSubmitSection button');

    // Wait for the first results to load
    await page.waitForSelector('a.blockForm.clickable', { timeout: 10000 });

    console.log('Initial page loaded \n');    


    // Get total number of pages
    const totalPages = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.sc-irEpRR.hjEfEt.dgaui.dgaui_tab'));
        const pageNumbers = buttons.map(button => parseInt(button.textContent.trim())).filter(num => !isNaN(num));
        return Math.max(...pageNumbers);
    });

    console.log(`Total pages detected: ${totalPages} \n`);

    // Create or overwrite the file
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');

    // Initialize the counter for scraped recoreds
    let current_recored_number = 0;

    // Loop through all pages and scrape data
    let currentPage = 1;
    while (currentPage <= totalPages && current_recored_number < max_recoreds) {
        console.log(`Scraping page ${currentPage}...`);

        // Scrape inital data
        const data = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a.blockForm.clickable')).map(item => ({
                link: item.href
            }));
        });

        console.log(`Page ${currentPage} Data:`, data, '\n');

        // Loop through each link, open it in a new tab, and scrape its data
        for (const { link } of data) {
            const newPage = await browser.newPage();
            await newPage.goto(link, { waitUntil: 'domcontentloaded' });
            
            // Wait 1.5s
            await new Promise(r => setTimeout(r, 1500));

        // Scrape data from the linked page
        const linkedPageData = await newPage.evaluate((link) => {
            const getData = (labelText) => {
                const labels = Array.from(document.querySelectorAll('.groupItemShow .lableShow'))
                    .filter(el => el.textContent.trim() === labelText);
                
                // If multiple licenses exist, extract all of them
                if (labels.length > 1) {
                    return labels.map(label => label.nextElementSibling?.textContent.trim());
                }
                else {
                    return labels.map(label => label.nextElementSibling?.textContent.trim()).join(", ");
                }
                
                return 'No data';
            };

            return {
                "link": link,
                "mediator_type": getData('نوع الوسيط'),
                "mediator_name": getData('اسم الوسيط'),
                "facility_Unified_number": getData('الرقم الموحد للمنشـأة'),
                "phone": getData('رقم الجوال'),
                "email": getData('البريد الإلكتروني'),
                "region": getData('المنطقة'),
                "city": getData('المدينة'),
                "neighborhood": getData('الحي'),
                "street": getData('الشارع'),
                "postal_code": getData('الرمز البريدي'),
                "building_number": getData('رقم المبنى'),
                "additional_code": getData('الرمز الإضافي'),
                "license_type": getData('نوع الرخصة'), // Now this will handle multiple licenses
                "license_number": getData('رقم الرخصة'),
                "license_status": getData('حالة الرخصة')
            };
        }, link);

        console.log(`Scraped data from ${link}:`, linkedPageData);

            // Append the data to the JSON file
            const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // Append the new data to the existing data
            existingData.push(linkedPageData);

            // Write the updated data back to the file
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

            await newPage.close(); // Close the tab after scraping
            console.log('Data saved in json file \n')

            current_recored_number++

            // Stop if the limit is reached
            if (current_recored_number >= max_recoreds) break;
        }

        // Click the next page button
        if (currentPage < totalPages) {
            await page.evaluate(() => {
                const nextButton = document.querySelector('.sc-irEpRR.hjEfEt.dgaui.dgaui_tab.noAfter:last-child');
                if (nextButton) nextButton.click();
            });
            
            // Wait 1s
            await new Promise(r => setTimeout(r, 1000));

            // Wait for the first results to load
            await page.waitForSelector('a.blockForm.clickable', { timeout: 10000 });
        }

        currentPage++;
    }

    console.log("Scraping finished.");
    await browser.close();
}

// License options in Arabic
const licenses_ar = [
    "رخصة فال للوساطة والتسويق",
    "رخصة فال لإدارة المرافق",
    "رخصة فال لإدارة الاملاك",
    "رخصة فال للمزادات العقارية",
    "رخصة فال للاستشارات العقارية",
    "رخصة فال للتحليلات العقارية"
];

// Mediator options
const mediators = [
    "وسيط منشأة",
    "وسيط فرد"
];

// License options in English
const licenses_en = [
    "brokerage_and_marketing",
    "facility_management",
    "property_management",
    "real_estate_auctions",
    "real_estate_consulting",
    "real_estate_analytics"
];


// Input parameters
const license = 0
const mediator = 0
const max_records = 11 // eneter 'Infinity' to scrape all available recoreds
const filePath = `${licenses_en[license]}-${max_records}_recoreds.json`;


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
scrapeWebsite(licenses_ar[license], mediators[mediator], max_records, filePath);
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// For advance scraping you can use loops, for example:
// for (let i = 0; i < 3; i++) {
//     const license = i
//     const mediator = 0
//     const max_records = 5 // eneter 'Infinity' to scrape all available recoreds
//     const filePath = `${licenses_en[i]}-${max_records}_recoreds.json`;

//     scrapeWebsite(licenses_ar[license], mediators[mediator], max_records, filePath);
// }