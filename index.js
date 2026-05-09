require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Events
} = require('discord.js');

const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = './data.json';

// 如果 data.json 不存在就建立
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}');
}

// 讀取資料
function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// 儲存資料
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

client.once(Events.ClientReady, () => {
  console.log('Bot 已上線');
});

client.on(Events.InteractionCreate, async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const data = loadData();
  const userId = interaction.user.id;

  // 建立玩家資料
  if (!data[userId]) {
    data[userId] = {
      coins: 0
    };
  }

  // /ping
  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }

  // /簽到
  if (interaction.commandName === '簽到') {

    data[userId].coins += 100;

    saveData(data);

    await interaction.reply(
      `✨ ${interaction.user.username} 獲得 100 星雨幣！`
    );
  }

  // /錢包
  if (interaction.commandName === '錢包') {

    await interaction.reply({
     content: `💰 你目前有 ${data[userId].coins} 星雨幣`,
     ephemeral: true
   });
  }
 // /排行榜
 if (interaction.commandName === '排行榜') {

   const leaderboard = Object.entries(data)
     .sort((a, b) => b[1].coins - a[1].coins)
     .slice(0, 10);

   let text = '🏆 星雨幣排行榜\n\n';

   for (let i = 0; i < leaderboard.length; i++) {

     const userId = leaderboard[i][0];
     const coins = leaderboard[i][1].coins;

     text += `${i + 1}. <@${userId}> - ${coins} 星雨幣\n`;
   }

   await interaction.reply(text);
}
});

client.login(process.env.TOKEN);
