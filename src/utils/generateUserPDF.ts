import puppeteer from 'puppeteer';

export const generateUserPDFBuffer = async (htmlContent: string): Promise<Buffer> => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();

    return Buffer.from(pdf);
};
