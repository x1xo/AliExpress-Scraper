import dotenv from "dotenv"
import e from "express";
import puppeteer from "puppeteer";

dotenv.config();

const app = e();
app.disable("x-powered-by");

const options = {
    headless: process.env.ENV==="production",
    defaultViewport: {width: 1366, height: 768},
}
if(process.env.ENV==="production") {
    options.executablePath= '/usr/bin/chromium-browser'
    options.args = ['--no-sandbox', '--disable-setuid-sandbox']
}

const browser = await puppeteer.launch(options);

const cache = new Map();

app.get("/aliexpress", async (req, res) => {
    const auth = req.headers["api-key"];
    if(!auth || auth != process.env.API_KEY) {
        return res.end()
    }

    const url = req.query.url;
    if(!url) {
        return res.end();
    }

    const parsedURL = new URL(url);
    const cacheEntry = cache.get(parsedURL.origin+parsedURL.pathname);
    if(cacheEntry && cacheEntry.createdAt+60*60*1000 > Date.now()) {
        return res.send(cacheEntry);
    }

    console.log(`request for ${url}`);
    const page = await browser.newPage();

    await page.goto(url);


    const title = await page.title();

    const imageSlider = "#root > div > div.pdp-body.pdp-wrap > div > div.pdp-body-top-left > div.pdp-info > div.pdp-info-left > div > div > div.slider--wrap--krlZ7X9 > div.slider--slider--uRpGJpg > div";

    await page.waitForSelector(imageSlider, { timeout: 5000});
    // Select all images within the slider
    const images = await page.$$(`${imageSlider} > div > div > img`);

    // Extract the `src` attribute of each image
    const imageUrls = await Promise.all(
        images.map(async (img) => {
            const src = await img.getProperty("src");
            return src.jsonValue(); // Convert the handle to string value
        })
    );

    for(let i = 0; i < imageUrls.length; i++) {
        const split = imageUrls[i].split("_");

        imageUrls[i] = split[0]
    }

    const price = await page.$eval(".product-price-value", (el) => el.innerText).catch(() => null);

    autoScroll(page);
    
    await page.waitForSelector("#product-description", {timeout: 5000}).catch(() => {});
    const description = await page.$eval("#product-description", (el) => el.innerText).catch((err) => err);
    if(description instanceof Error) {
        await page.close()
        return res.sendStatus(500);
    }

    const skuSelector = ".sku-item--property--HuasaIz";
    await page.waitForSelector(skuSelector).catch(() => {});

    // Extract SKUs and their options
    const skus = await page.evaluate(() => {
        const skuBlocks = document.querySelectorAll(".sku-item--property--HuasaIz");

        return Array.from(skuBlocks).map((skuBlock) => {
        // Get SKU Title (e.g., "Color", "Size")
            const titleElement = skuBlock.querySelector(".sku-item--title--Z0HLO87 span");
            const title = titleElement ? titleElement.textContent.trim() : null;

            const options = [];

            // Detect image-based SKUs
            const imageOptions = skuBlock.querySelectorAll(".sku-item--image--jMUnnGA img");
            if (imageOptions.length > 0) {
                imageOptions.forEach((img) => {
                    options.push({
                        type: "image",
                        value: img.getAttribute("alt"),  // Option name, e.g., "black", "white"
                        src: img.getAttribute("src"),   // Image URL
                    });
                });
            }

            // Detect text-based SKUs (e.g., sizes like S, M, L)
            const textOptions = skuBlock.querySelectorAll(".sku-item--text--hYfAukP");
            if (textOptions.length > 0) {
                textOptions.forEach((textOption) => {
                    options.push({
                        type: "text",
                        value: textOption.textContent.trim(),  // Option value, e.g., "S", "M", etc.
                    });
                });
            }

            return {
                title: title.split(":").length > 1 ? title.split(":")[0] : title,           // SKU title (e.g., "Color", "Size")
                options: options.length > 0 ? options : []  // If no options, return empty array
            };
        });
    }).catch(() => []);

    cache.set(parsedURL.origin+parsedURL.pathname, { title, price, description, skus, images: imageUrls, createdAt: Date.now() });
    res.send({ title, price, description, skus, images: imageUrls, });
    await page.close();
})

app.all("*", async (req, res) => {
    res.end();
})
// Scroll till the end of the page
async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }).catch(()=>{});
}

app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));