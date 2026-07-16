const fs = require('fs');

function cleanFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  
  // Fix tableHeader
  content = content.replace(/function tableHeader[\s\S]*?doc\.y \+= 4;\n}/, `function tableHeader(cols) {
  needPage(30);
  const startY = doc.y;
  doc.roundedRect(ML, startY, CW, 20, 3).fill(C.bg);
  doc.font('Bold').fontSize(9).fillColor(C.dark);
  let x = ML + 10;
  cols.forEach(c => {
    doc.text(c.label, x, startY + 6, { width: c.w });
    x += c.w;
  });
  doc.y = startY + 25;
}`);

  // Replace emojis in featureCard
  content = content.replace(/featureCard\('🤖'/g, "featureCard('1'");
  content = content.replace(/featureCard\('📱'/g, "featureCard('2'");
  content = content.replace(/featureCard\('🔑'/g, "featureCard('3'");
  content = content.replace(/featureCard\('🌐'/g, "featureCard('4'");
  content = content.replace(/featureCard\('🏅'/g, "featureCard('V'");
  content = content.replace(/featureCard\('⭐'/g, "featureCard('*'");
  content = content.replace(/featureCard\('🏆'/g, "featureCard('T'");
  content = content.replace(/featureCard\('📊'/g, "featureCard('='");
  content = content.replace(/featureCard\('🟢'/g, "featureCard('V'");
  content = content.replace(/featureCard\('🟡'/g, "featureCard('-'");
  content = content.replace(/featureCard\('⚫'/g, "featureCard('X'");
  content = content.replace(/featureCard\('🔴'/g, "featureCard('X'");
  content = content.replace(/featureCard\('⚪'/g, "featureCard('X'");
  content = content.replace(/featureCard\('📋'/g, "featureCard('L'");
  content = content.replace(/featureCard\('⚙'/g, "featureCard('P'");
  content = content.replace(/featureCard\('✅'/g, "featureCard('V'");
  content = content.replace(/featureCard\('🎯'/g, "featureCard('A'");
  content = content.replace(/featureCard\('📁'/g, "featureCard('F'");
  content = content.replace(/featureCard\('👥'/g, "featureCard('G'");
  content = content.replace(/featureCard\('📅'/g, "featureCard('C'");
  content = content.replace(/featureCard\('🔔'/g, "featureCard('!'");
  content = content.replace(/featureCard\('💬'/g, "featureCard('C'");
  content = content.replace(/featureCard\('✍'/g, "featureCard('W'");
  content = content.replace(/featureCard\('🔎'/g, "featureCard('S'");
  content = content.replace(/featureCard\('📖'/g, "featureCard('R'");
  content = content.replace(/featureCard\('🏢'/g, "featureCard('B'");
  content = content.replace(/featureCard\('📰'/g, "featureCard('N'");
  content = content.replace(/featureCard\('💡'/g, "featureCard('I'");
  content = content.replace(/featureCard\('📍'/g, "featureCard('M'");
  content = content.replace(/featureCard\('👑'/g, "featureCard('K'");
  content = content.replace(/featureCard\('🔗'/g, "featureCard('L'");
  content = content.replace(/featureCard\('🔄'/g, "featureCard('R'");
  content = content.replace(/featureCard\('📈'/g, "featureCard('U'");
  content = content.replace(/featureCard\('ℹ️'/g, "featureCard('i'");
  content = content.replace(/featureCard\('⚠️'/g, "featureCard('!'");
  content = content.replace(/featureCard\('🚨'/g, "featureCard('X'");
  content = content.replace(/icon = 'ℹ️'/g, "icon = 'i'");
  content = content.replace(/icon = '⚠️'/g, "icon = '!'");
  content = content.replace(/icon = '✅'/g, "icon = 'V'");
  content = content.replace(/icon = '🚨'/g, "icon = 'X'");

  // Fix infoBox rendering
  content = content.replace(/doc\.font\('Bold'\)\.fontSize\(10\)\.fillColor\(color\)\.text\(`\$\{icon\}  \$\{title\}`/g, "doc.font('Bold').fontSize(12).fillColor(color).text(`[ ${icon} ]  ${title}`");
  content = content.replace(/doc\.font\('Regular'\)\.fontSize\(9\.5\)\.fillColor\(C\.text\)\.text\(text, ML \+ 15, doc\.y \+ 4/g, "doc.font('Regular').fontSize(9.5).fillColor(C.text).text(text, ML + 15, boxY + 28");

  // Fix featureCard rendering
  content = content.replace(/doc\.font\('Regular'\)\.fontSize\(12\)\.fillColor\(C\.primary\)\.text\(icon, ML \+ 10, cardY \+ 15/g, "doc.font('Bold').fontSize(14).fillColor(C.primary).text(icon, ML + 10, cardY + 14");
  content = content.replace(/doc\.font\('Regular'\)\.fontSize\(9\.5\)\.fillColor\(C\.text\)\.text\(text, ML \+ 45, doc\.y \+ 2/g, "doc.font('Regular').fontSize(9.5).fillColor(C.text).text(text, ML + 45, cardY + 26");

  fs.writeFileSync(path, content);
}

['generate_volunteer_guide.js', 'generate_master_guide.js'].forEach(file => {
  cleanFile(`/Users/akmalrustamov/.gemini/antigravity/brain/784ab91e-4b4f-4d23-9af9-4b2f5010ce53/scratch/${file}`);
});
