require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');

const client = new Client({
intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
]

});

const DATA_FILE = './data.json';

const shop = {
  '95折券': 50,
  '9折券: 100,
  '85折券': 200
};

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

client.on('messageCreate', async message => {

  if (message.author.bot) return;

  const random = Math.floor(Math.random() * 100);

  if (random < 5) {

    const button =
      new ButtonBuilder()
        .setCustomId('claim_rain')
        .setLabel('領取星雨幣')
        .setStyle(ButtonStyle.Primary);

    const row =
      new ActionRowBuilder()
        .addComponents(button);

    const dropMessage =
      await message.channel.send({
        content:
`☔ 星雨幣掉落！

前 10 個點擊的人，
將隨機瓜分 50 星雨幣 ✨`,
        components: [row]
      });

    const claimedUsers = [];

    let remainingCoins = 50;

    const collector =
      dropMessage.createMessageComponentCollector({
        time: 30000
      });

    collector.on('collect', async interaction => {

      const userId = interaction.user.id;

      if (claimedUsers.includes(userId)) {

        return interaction.reply({
          content: '你已經領過了 ☔',
          ephemeral: true
        });

      }

      if (!claimedUsers.includes(userId)) {

        const data = loadData();

        if (!data[userId]) {
          data[userId] = {
            coins: 0
          };
        }

        let reward;

        const leftPeople =
          10 - claimedUsers.length;

        if (leftPeople === 1) {

          reward = remainingCoins;

        } else {

          reward =
            Math.floor(
              Math.random() *
              (remainingCoins / 2)
            ) + 1;

        }

        remainingCoins -= reward;

        data[userId].coins += reward;

        claimedUsers.push(userId);

        saveData(data);

        await interaction.reply({
          content:
`☔ 你搶到了 ${reward} 星雨幣！`,
          ephemeral: true
        });

      }

      if (
        claimedUsers.length >= 10 ||
        remainingCoins <= 0
      ) {

        collector.stop();

        button.setDisabled(true);

        await dropMessage.edit({
          content:
`☔ 星雨幣已被搶完！

總共 50 星雨幣 ✨`,
          components: [
            new ActionRowBuilder()
              .addComponents(button)
          ]
        });

      }

    });

 }

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

// /給予
if (interaction.commandName === '給予') {

  // 只有群組擁有者可用
  if (
    interaction.guild.ownerId !== interaction.user.id
  ) {
    return interaction.reply({
      content: '❌ 只有群組擁有者可以使用',
      ephemeral: true
    });
  }

  const target =
    interaction.options.getUser('玩家');

  const amount =
    interaction.options.getInteger('數量');

  if (!data[target.id]) {
    data[target.id] = {
      coins: 0
    };
  }

  data[target.id].coins += amount;

  saveData(data);

  await interaction.reply({
    content:
`✅ 已給予 ${target.username} ${amount} 星雨幣`,
    ephemeral: true
  });

}

// /扣除
if (interaction.commandName === '扣除') {

  // 只有群組擁有者可用
  if (
    interaction.guild.ownerId !== interaction.user.id
  ) {
    return interaction.reply({
      content: '❌ 只有群組擁有者可以使用',
      ephemeral: true
    });
  }

  const target =
    interaction.options.getUser('玩家');

  const amount =
    interaction.options.getInteger('數量');

  if (!data[target.id]) {
    data[target.id] = {
      coins: 0
    };
  }

  data[target.id].coins -= amount;

  if (data[target.id].coins < 0) {
    data[target.id].coins = 0;
  }

  saveData(data);

  await interaction.reply({
    content:
`❌ 已扣除 ${target.username} ${amount} 星雨幣`,
    ephemeral: true
  });

}

// /商店
if (interaction.commandName === '商店') {

  let text = '🛒 星雨商店\n\n';

  for (const item in shop) {
    text += `✨ ${item} - ${shop[item]} 星雨幣\n`;
  }

  await interaction.reply({
    content: text,
    ephemeral: true
  });

}

// /購買
if (interaction.commandName === '購買') {

  const item =
    interaction.options.getString('商品');

  if (!shop[item]) {
    return interaction.reply({
      content: '❌ 找不到這個商品',
      ephemeral: true
    });
  }

  const price = shop[item];

  if (data[userId].coins < price) {
    return interaction.reply({
      content: '❌ 星雨幣不足',
      ephemeral: true
    });
  }

  data[userId].coins -= price;

  saveData(data);

  await interaction.reply({
    content:
`🛒 你購買了 ${item}！

花費 ${price} 星雨幣`,
    ephemeral: true
  });

}

 // /排行榜
 if (interaction.commandName === '排行榜') {

   const leaderboard = Object.entries(data)
     .sort((a, b) => b[1].coins - a[1].coins);

   const rank =
     leaderboard.findIndex(
       user => user[0] === userId
     ) + 1;

   const coins = data[userId].coins;

   await interaction.reply({
     content:
 `🏆 你的排名：#${rank}

 💰 你的星雨幣：${coins}`,
     ephemeral: true
   });

}

});
client.login(process.env.TOKEN);
