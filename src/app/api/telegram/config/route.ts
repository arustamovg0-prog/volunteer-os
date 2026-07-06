import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePrivilegedRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const config = await db.getBotConfig();
    
    // Mask the token for safety before sending to client
    const maskedToken = config.bot_token 
      ? `${config.bot_token.slice(0, 6)}...${config.bot_token.slice(-4)}` 
      : '';

    return NextResponse.json({
      ...config,
      bot_token: maskedToken,
      has_token: !!config.bot_token
    });
  } catch (error) {
    console.error('Failed to fetch bot config:', error);
    return NextResponse.json({ error: 'Failed to fetch bot config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requirePrivilegedRequest(req, ['admin']);
    if (authError) return authError;

    const body = await req.json();
    const { bot_token, webhook_url, is_simulator_enabled } = body;
    
    const updates: any = {};
    
    // Only update token if it's not the masked placeholder
    if (bot_token !== undefined && !bot_token.includes('...')) {
      updates.bot_token = bot_token;
    }
    
    if (webhook_url !== undefined) {
      updates.webhook_url = webhook_url;
    }
    
    if (is_simulator_enabled !== undefined) {
      updates.is_simulator_enabled = !!is_simulator_enabled;
    }

    const updatedConfig = await db.updateBotConfig(updates);
    
    const maskedToken = updatedConfig.bot_token 
      ? `${updatedConfig.bot_token.slice(0, 6)}...${updatedConfig.bot_token.slice(-4)}` 
      : '';

    return NextResponse.json({
      ...updatedConfig,
      bot_token: maskedToken,
      has_token: !!updatedConfig.bot_token
    });
  } catch (error) {
    console.error('Failed to update bot config:', error);
    return NextResponse.json({ error: 'Failed to update bot config' }, { status: 500 });
  }
}
