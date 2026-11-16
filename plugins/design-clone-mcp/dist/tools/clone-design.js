/**
 * Clone Design Tool
 *
 * Uses Puppeteer to capture website design elements
 */
import puppeteer from 'puppeteer';
export async function cloneDesign(url) {
    console.error(`Capturing design from: ${url}`);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        // Navigate to the page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        // Extract design data
        const designData = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const colors = new Set();
            const fonts = new Set();
            const sections = [];
            // Extract colors and fonts from all elements
            elements.forEach((el) => {
                const styles = window.getComputedStyle(el);
                // Colors
                const bgColor = styles.backgroundColor;
                const color = styles.color;
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                    colors.add(bgColor);
                }
                if (color) {
                    colors.add(color);
                }
                // Fonts
                const fontFamily = styles.fontFamily;
                if (fontFamily) {
                    fonts.add(fontFamily);
                }
            });
            // Extract main sections
            const sectionTags = ['header', 'main', 'section', 'footer', 'article', 'nav'];
            sectionTags.forEach((tag) => {
                const els = document.querySelectorAll(tag);
                els.forEach((el) => {
                    const styles = window.getComputedStyle(el);
                    sections.push({
                        tag,
                        className: el.className,
                        html: el.outerHTML.substring(0, 5000), // Limit size
                        computedStyles: {
                            backgroundColor: styles.backgroundColor,
                            color: styles.color,
                            fontSize: styles.fontSize,
                            fontFamily: styles.fontFamily,
                            padding: styles.padding,
                            margin: styles.margin,
                            display: styles.display,
                            width: styles.width,
                            height: styles.height,
                        },
                    });
                });
            });
            return {
                url: window.location.href,
                title: document.title,
                html: document.documentElement.outerHTML.substring(0, 50000),
                colors: Array.from(colors).slice(0, 20),
                fonts: Array.from(fonts).slice(0, 10),
                sections: sections.slice(0, 10),
                metadata: {
                    capturedAt: new Date().toISOString(),
                    viewport: {
                        width: 1920,
                        height: 1080,
                    },
                },
            };
        });
        console.error(`✅ Captured ${designData.colors.length} colors, ${designData.fonts.length} fonts, ${designData.sections.length} sections`);
        return designData;
    }
    finally {
        await browser.close();
    }
}
