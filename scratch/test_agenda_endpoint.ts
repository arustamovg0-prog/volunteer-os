import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/agenda-assistant/route';

async function main() {
  console.log('Testing GET /api/agenda-assistant endpoint directly...');
  const req = new NextRequest('http://localhost:3000/api/agenda-assistant?period=7d');
  const res = await GET(req);
  console.log('Response status:', res.status);
  const json = await res.json();
  console.log('Summary:', json.summary);
  console.log('Total items in list:', json.items?.length);
  if (json.items && json.items.length > 0) {
    console.log('Sample item 0:', json.items[0]);
  }
}

main().catch(console.error);
