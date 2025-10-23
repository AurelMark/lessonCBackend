import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { readdir } from 'fs/promises';
import fs, { constants } from 'fs';
import { mkdir, access, rm, unlink, rename } from 'fs/promises';
import path from 'path';
import { catchAsync } from '@/utils/asyncHandler';
import slugify from 'slugify';
import mime from 'mime-types';

function getMimeType(filePath: string) {
    return mime.lookup(filePath) || 'application/octet-stream';
}

const allowedPaths = {
    public: ['blog', 'course', 'subcourse', 'homepage'],
    private: ['lesson', 'examen', 'stats', 'user'],
};

export const listUploads = catchAsync(async (req: Request, res: Response) => {
    const folder = req.query.folder as string || '';
    const uploadsPublicPath = path.join(process.cwd(), 'uploads', 'public', folder);

    if (!fs.existsSync(uploadsPublicPath)) {
        return res.status(StatusCodes.OK).json({ files: [] });
    }

    const files = await readdir(uploadsPublicPath, { withFileTypes: true });

    const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'folder' : 'file',
        url: file.isDirectory()
            ? `/uploads/public/${folder ? folder + '/' : ''}${file.name}`
            : `/uploads/public/${folder ? folder + '/' : ''}${file.name}`
    }));

    res.status(StatusCodes.OK).json({ files: fileList });
});


export const listPublicUploads = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params['path'] || '';
    const safeSlug = slug.replace(/\.\.\//g, '');
    const uploadsPath = path.join(process.cwd(), 'uploads', 'public', safeSlug);

    if (!fs.existsSync(uploadsPath)) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Folder not found' });
    }

    const files = await readdir(uploadsPath, { withFileTypes: true });

    const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'folder' : 'file',
        url: `/uploads/public/${safeSlug ? safeSlug + '/' : ''}${file.name}`
    }));

    res.status(StatusCodes.OK).json(fileList);
});

export const listPrivateUploads = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params['path'] || '';
    const safeSlug = slug.replace(/\.\.\//g, '');
    const uploadsPath = path.join(process.cwd(), 'uploads', 'private', safeSlug);

    if (!fs.existsSync(uploadsPath)) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Folder not found' });
    }

    const files = await readdir(uploadsPath, { withFileTypes: true });

    const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'folder' : 'file',
        url: `/uploads/private/${safeSlug ? safeSlug + '/' : ''}${file.name}`
    }));

    res.status(StatusCodes.OK).json(fileList);
});

export const getPublicFolderContent = catchAsync(async (req: Request, res: Response) => {
    const { slug, nameFolder } = req.params;
    const safeSlug = (slug || '').replace(/\.\.\//g, '');
    const safeNameFolder = (nameFolder || '').replace(/\.\.\//g, '');

    const uploadsPath = nameFolder
        ? path.join(process.cwd(), 'uploads', 'public', safeSlug, safeNameFolder)
        : path.join(process.cwd(), 'uploads', 'public', safeSlug);

    if (!fs.existsSync(uploadsPath)) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Folder not found' });
    }

    const files = await readdir(uploadsPath, { withFileTypes: true });

    const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'folder' : 'file',
        url: nameFolder
            ? path.posix.join('/uploads/public', safeSlug, safeNameFolder, file.name)
            : path.posix.join('/uploads/public', safeSlug, file.name)
    }));
    res.status(StatusCodes.OK).json(fileList);
});

export const getPrivateFolderContent = catchAsync(async (req: Request, res: Response) => {
    const { slug, nameFolder } = req.params;
    const safeSlug = (slug || '').replace(/\.\.\//g, '');
    const safeNameFolder = (nameFolder || '').replace(/\.\.\//g, '');

    const uploadsPath = nameFolder
        ? path.join(process.cwd(), 'uploads', 'private', safeSlug, safeNameFolder)
        : path.join(process.cwd(), 'uploads', 'private', safeSlug);

    if (!fs.existsSync(uploadsPath)) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Folder not found' });
    }

    const files = await readdir(uploadsPath, { withFileTypes: true });

    const fileList = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'folder' : 'file',
        url: nameFolder
            ? path.posix.join('/uploads/private', safeSlug, safeNameFolder, file.name)
            : path.posix.join('/uploads/private', safeSlug, file.name)
    }));
    res.status(StatusCodes.OK).json(fileList);
});

export const createFolder = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { scope, category, name } = req.body;

    if (!['public', 'private'].includes(scope)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid scope' });
    }

    if (!allowedPaths[scope as keyof typeof allowedPaths].includes(category)) {
        res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Invalid category for this scope',
        });
    }

    if (!name || typeof name !== 'string') {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Name is required' });
    }

    const slug = slugify(name, { lower: true, strict: true });
    const folderPath = path.join(process.cwd(), 'uploads', scope, category, slug);

    try {
        await access(folderPath, constants.F_OK);
        res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Folder already exists',
        });
    } catch {
        await mkdir(folderPath, { recursive: true });
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Folder created',
            path: `/uploads/${scope}/${category}/${slug}`,
        });
    }
});

export const deleteFolder = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { scope, category, folder } = req.params;

    if (!['public', 'private'].includes(scope)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid scope' });
    }

    if (!allowedPaths[scope as keyof typeof allowedPaths].includes(category)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid category for this scope' });
    }

    if (!folder || typeof folder !== 'string') {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Folder is required' });
    }

    const cleanFolder = slugify(folder, { lower: true, strict: true });
    const folderPath = path.join(process.cwd(), 'uploads', scope, category, cleanFolder);

    try {
        await rm(folderPath, { recursive: true, force: true });
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Folder and its contents deleted',
            folder: `/${scope}/${category}/${cleanFolder}`
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete folder',
            error,
        });
    }
});

export const uploadFiles = catchAsync(async (req: Request, res: Response) => {
    const normalizePath = (fullPath: string) => {
        let relPath = path.relative(
            path.join(process.cwd(), 'uploads'),
            fullPath
        ).replace(/\\/g, '/');

        return path.posix.normalize('/uploads/' + relPath);
    };

    const files: Express.Multer.File[] = Array.isArray(req.files) ? req.files : [];
    const normalizedFiles = files
        .filter((file) => file && typeof file.path === 'string')
        .map((file) => ({
            ...file,
            path: normalizePath(file.path),
        }));

    res.status(StatusCodes.OK).json({
        success: true,
        files: normalizedFiles,
    });
});

export const uploadFilesHomepage = catchAsync(async (req: Request, res: Response) => {
    const normalizePath = (fullPath: string) => {
        let relPath = path.relative(
            path.join(process.cwd(), 'uploads'),
            fullPath
        ).replace(/\\/g, '/');
        return path.posix.normalize('/uploads/' + relPath);
    };

    const files: Express.Multer.File[] = Array.isArray(req.files) ? req.files : [];
    const normalizedFiles = files
        .filter((file) => file && typeof file.path === 'string')
        .map((file) => ({
            ...file,
            path: normalizePath(file.path),
        }));

    res.status(StatusCodes.OK).json({
        success: true,
        files: normalizedFiles,
    });
});


export const deleteFile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { scope, category, folder, filename } = req.params;

    if (!scope || !category || !folder || !filename) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing required parameters' });
    }

    const filePath = path.join(process.cwd(), 'uploads', scope, category, folder, filename);

    try {
        await unlink(filePath);
        res.status(StatusCodes.OK).json({ success: true, message: 'File deleted successfully' });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'File not found' });
        }
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to delete file', error });
    }
});

export const deleteMultipleFiles = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { scope, category, folder } = req.params;
    const { filenames } = req.body;

    if (!scope || !category || !folder || !Array.isArray(filenames)) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing parameters or filenames must be an array' });
    }

    const uploadPath = path.join(process.cwd(), 'uploads', scope, category, folder);

    const results = await Promise.allSettled(
        filenames.map(async (filename: string) => {
            const filePath = path.join(uploadPath, filename);
            await unlink(filePath);
            return filename;
        })
    );

    const deleted: string[] = [];
    const failed: { filename: string; reason: string }[] = [];

    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            deleted.push(filenames[i]);
        } else {
            failed.push({ filename: filenames[i], reason: result.reason.message });
        }
    });

    res.status(StatusCodes.OK).json({ deleted, failed });
});

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

export const renameFile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { scope, category, folder } = req.params;
    const { oldName, newName } = req.body;

    if (!scope || !category || !folder || !oldName || !newName) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing required parameters' });
    }

    const safeCategory = slugify(category, { lower: true, strict: true });
    const safeFolder = slugify(folder, { lower: true, strict: true });
    const basePath = path.join(process.cwd(), 'uploads', scope, safeCategory, safeFolder);

    const oldPath = path.join(basePath, oldName);
    const ext = path.extname(oldName);
    const baseNewName = path.basename(newName, ext);
    let finalNewName = slugify(baseNewName, { lower: true, strict: true }) + ext;
    let counter = 1;

    // избегаем конфликта имён
    while (await fileExists(path.join(basePath, finalNewName))) {
        finalNewName = `${slugify(baseNewName, { lower: true, strict: true })}-${counter}${ext}`;
        counter++;
    }

    const newPath = path.join(basePath, finalNewName);
    await rename(oldPath, newPath);

    res.status(StatusCodes.OK).json({
        success: true,
        oldName,
        newName: finalNewName,
        message: 'File renamed successfully',
    });
});


export const streamPrivateFile = catchAsync(async (req, res) => {
    const { slug, nameFolder, filename } = req.params;
    const safeSlug = (slug || '').replace(/\.\.\//g, '');
    const safeNameFolder = (nameFolder || '').replace(/\.\.\//g, '');
    const safeFilename = (filename || '').replace(/\.\.\//g, '');

    const filePath = path.join(
        process.cwd(),
        'uploads',
        'private',
        safeSlug,
        safeNameFolder,
        safeFilename
    );

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': getMimeType(filePath),
        });
        file.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': getMimeType(filePath),
            'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

export const deleteFileHomepage = async (req: Request, res: Response) => {
    const { scope, category, filename } = req.params;

    if (!scope || !category || !filename || category !== 'homepage') {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing required parameters or not homepage category' });
        return;
    }

    const filePath = path.join(process.cwd(), 'uploads', scope, category, filename);

    try {
        await unlink(filePath);
        res.status(StatusCodes.OK).json({ success: true, message: 'File deleted successfully' });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'File not found' });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Failed to delete file', error });
        }
    }
};