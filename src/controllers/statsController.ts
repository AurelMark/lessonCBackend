import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import StatsLogModel from '@/models/StatsLogModel';
import puppeteer from 'puppeteer';
import { catchAsync } from '@/utils/asyncHandler';

export const getAllStatsLogs = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filters: Record<string, any> = {};

    if (req.query.login) filters.login = req.query.login.toString();
    if (req.query.method) filters.method = req.query.method.toString().toUpperCase();
    if (req.query.ip) filters.ip = req.query.ip.toString();

    if (req.query.from || req.query.to) {
        filters.createdAt = {};
        if (req.query.from) filters.createdAt.$gte = new Date(req.query.from.toString());
        if (req.query.to) filters.createdAt.$lte = new Date(req.query.to.toString());
    }

    const [total, stats] = await Promise.all([
        StatsLogModel.countDocuments(filters),
        StatsLogModel.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    ]);

    const htmlContent = `
        <html>
        <head>
            <title>Stats Log</title>
            <style>
                body { font-family: sans-serif; font-size: 12px; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #999; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h2>Request Stats Log</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>IP</th>
                        <th>Method</th>
                        <th>URL</th>
                        <th>Login</th>
                        <th>Device</th>
                        <th>Browser</th>
                        <th>OS</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.map((log, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${log.createdAt && new Date(log.createdAt).toLocaleString()}</td>
                            <td>${log.ip || '-'}</td>
                            <td>${log.method}</td>
                            <td>${log.url}</td>
                            <td>${log.login || '-'}</td>
                            <td>${log.deviceType}</td>
                            <td>${log.browser}</td>
                            <td>${log.os}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

    if (req.query.export === 'pdf') {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=stats-log.pdf');
        res.send(pdfBuffer);
        return;
    }

    if (req.query.export === 'html') {
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
        return;
    }

    const totalPages = Math.ceil(total / limit);

    res.status(StatusCodes.OK).json({
        success: true,
        total,
        totalPages,
        currentPage: page,
        statsPerPage: stats.length,
        data: stats
    });
});
