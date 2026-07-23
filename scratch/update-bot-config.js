const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const conf = await prisma.botConfig.findFirst();
  console.log("Bot Config:", conf);
  
  if (conf) {
    await prisma.botConfig.update({
      where: { id: conf.id },
      data: { 
        botToken: "8984401269:AAG0A9Y2loEjkKii-h9-Ko1GfgHioP4Gsno",
        webhookUrl: "https://volunteer-os-zeta.vercel.app/"
      }
    });
    console.log("Updated DB config");
  } else {
    await prisma.botConfig.create({
      data: {
        id: 1,
        botToken: "8984401269:AAG0A9Y2loEjkKii-h9-Ko1GfgHioP4Gsno",
        webhookUrl: "https://volunteer-os-zeta.vercel.app/",
        isSimulatorEnabled: true
      }
    });
    console.log("Created DB config");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
