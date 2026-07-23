import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('file_id');
  const fileName = req.nextUrl.searchParams.get('file_name') || 'downloaded_file';

  if (!fileId) {
    return NextResponse.json({ error: 'file_id is required' }, { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'Telegram bot token is not configured' }, { status: 500 });
  }

  try {
    // 1. Get file_path from Telegram
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoRes.json();

    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.error('Failed to get file path from Telegram:', fileInfo);
      return NextResponse.json({ error: 'Failed to get file path from Telegram' }, { status: 500 });
    }

    const filePath = fileInfo.result.file_path;

    // 2. Fetch the actual file
    const fileRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);

    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Failed to download file from Telegram' }, { status: 500 });
    }

    // 3. Stream the file back to the client
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    if (fileRes.headers.get('Content-Type')) {
      headers.set('Content-Type', fileRes.headers.get('Content-Type') as string);
    }
    if (fileRes.headers.get('Content-Length')) {
      headers.set('Content-Length', fileRes.headers.get('Content-Length') as string);
    }

    return new NextResponse(fileRes.body, {
      status: 200,
      headers
    });
  } catch (err) {
    console.error('Error proxying telegram file:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
