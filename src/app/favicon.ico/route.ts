import {NextResponse} from 'next/server';
import {readFile} from 'fs/promises';
import {join} from 'path';

export async function GET() {
    try {
        const filePath = join(process.cwd(), 'public', 'images', 'logos', 'logo.svg');
        const fileContents = await readFile(filePath);
        
        return new NextResponse(new Uint8Array(fileContents), {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        // If file doesn't exist, return 404
        return new NextResponse(null, {status: 404});
    }
}


