require('dotenv').config();

const { createClient } =
  require('@supabase/supabase-js');

const supabase =
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder
} = require('discord.js');


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]

});


  async function getShop() {

    const { data, error } =
      await supabase
        .from('shop')
        .select('*');

    if (error) {
      console.log(error);
      return [];
    }

    return data;

  }

// 讀取資料
async function getUser(userId) {

  const { data, error } =
    await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

// 如果玩家不存在
  if (!data) {

    await supabase
      .from('users')
      .insert([
        {
          user_id: userId,
          coins: 0
        }
      ]);

    return {
      user_id: userId,
      coins: 0
    };

  }

  return data;

}

async function updateCoins(userId, coins) {

  await supabase
    .from('users')
    .update({
      coins: coins
    })
    .eq('user_id', userId);

}

// 新增在這裡
async function updateCheckin(userId, date) {

  await supabase
    .from('users')
    .update({
      last_checkin: date
    })
    .eq('user_id', userId);

}

async function addTransferRecord(
  senderId,
  receiverId,
  amount
) {

  await supabase
    .from('transfers')
    .insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        amount: amount
      }
    ]);

}

async function clearOldMessages(channel, title) {

  const messages =
    await channel.messages.fetch({
      limit: 100
    });

  for (const msg of messages.values()) {

    if (
      msg.author.id === client.user.id &&
      msg.embeds.length > 0 &&
      msg.embeds[0].title === title
    ) {

      try {

        await msg.delete();

        console.log(`已刪除: ${title}`);

      } catch (err) {

        console.log(`刪除失敗: ${title}`);

      }

    }

  }

}

client.once(Events.ClientReady, async () => {

  console.log('Railway 最新版本啟動');
  console.log('新版BOT啟動成功');
  console.log('Bot 已上線');
 
  console.log(process.env.CHANNEL_ID);
  console.log(process.env.CHECKIN_CHANNEL_ID);
  console.log(process.env.TRANSFER_CHANNEL_ID);
  console.log(process.env.SHOP_CHANNEL_ID);

  if (!process.env.CHANNEL_ID) {
    console.log('CHANNEL_ID 未設定');
  }

  if (!process.env.CHECKIN_CHANNEL_ID) {
    console.log('CHECKIN_CHANNEL_ID 未設定');
  }

  if (!process.env.TRANSFER_CHANNEL_ID) {
    console.log('TRANSFER_CHANNEL_ID 未設定');
  }

  if (!process.env.SHOP_CHANNEL_ID) {
    console.log('SHOP_CHANNEL_ID 未設定');
  }

    const walletChannel =
      await client.channels.fetch(
        process.env.CHANNEL_ID
      ); 

    const checkinChannel =
      await client.channels.fetch(
        process.env.CHECKIN_CHANNEL_ID
      );

    const shopChannel =
      await client.channels.fetch(
        process.env.SHOP_CHANNEL_ID
      );

    // 刪除舊 ATM
    await clearOldMessages(
      walletChannel,
      '🏦 星雨銀行 ATM'
    );

    // 刪除舊簽到
    await clearOldMessages(
      checkinChannel,
      '☔ 每日簽到' 
    );

   // 刪除舊商店
   await clearOldMessages(
     shopChannel,
     '🛒 星雨商店'
   );

    // 等待同步
    await new Promise(resolve =>
      setTimeout(resolve, 2000)
    );

  console.log(walletChannel);
  console.log(checkinChannel);
  
  if (
    !walletChannel ||
    !checkinChannel ||
    !shopChannel
  ) {
    console.log('找不到頻道');
    return;
  }

  const walletButton =
    new ButtonBuilder()
      .setCustomId('check_coins')
      .setLabel('💰 餘額查詢')
      .setStyle(ButtonStyle.Success);

  const transferButton =
    new ButtonBuilder()
      .setCustomId('open_transfer')
      .setLabel('💸 星雨轉帳')
      .setStyle(ButtonStyle.Primary);

  const walletRow =
    new ActionRowBuilder()
      .addComponents(
        walletButton,
        transferButton
      );

  const checkinButton =
    new ButtonBuilder()
      .setCustomId('daily_checkin')
      .setLabel('每日簽到')
      .setStyle(ButtonStyle.Success);

  await walletChannel.send({
    embeds: [
      new EmbedBuilder()
        .setColor('#00D26A')
        .setTitle('🏦 星雨銀行 ATM')
        .setDescription(
  `╔════════════╗
  💳 歡迎使用 星雨ATM
  ╚════════════╝

  💰 查詢餘額
  💸 星雨轉帳
  🔒 安全交易系統

  請點擊下方按鈕操作`
        )
        .addFields(
          {
            name: '🏧 狀態',
            value: '🟢 線上',
            inline: true
          },
          {
            name: '☔ 幣別',
            value: '星雨幣',
            inline: true
          },
          { 
            name: '🔒 安全',
            value: '已啟用',
            inline: true
          }
        )
        .setThumbnail(
          'https://cdn-icons-png.flaticon.com/512/2830/2830284.png'
        )
        .setImage(
          'https://cdn.discordapp.com/attachments/1501098193276895360/1503008880513253406/ChatGPT_Image_2026510_08_19_56.png?ex=6a01c999&is=6a007819&hm=6c10e8db7f2f31aa3991255cf8270280d58aa3ec5da616a7adb649e8d7aeae7c&'
        )
        .setFooter({
          text: 'Rain Bank ATM System'
        })
        .setTimestamp()
    ],
    components: [walletRow]
  });

  const checkinRow =
    new ActionRowBuilder()
      .addComponents(checkinButton);

  await checkinChannel.send({
    embeds: [
      new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('☔ 每日簽到')
        .setDescription(
  `✨ 每日可簽到一次

  完成簽到即可獲得 10 星雨幣`
        )
        .setFooter({
          text: '星雨系統'
        })
        .setTimestamp()
    ],
    components: [checkinRow]
  });

    const shopData =
      await getShop();

    const options =
      shopData.map(item => ({
        label: item.item_name,
        description:
          `${item.price} 星雨幣`,
        value: item.item_name
      }));

    const selectMenu =
      new StringSelectMenuBuilder()
        .setCustomId('shop_select')
        .setPlaceholder('選擇要購買的商品')
        .addOptions(options);

    const shopRow =
      new ActionRowBuilder()
        .addComponents(selectMenu);

    await shopChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🛒 星雨商店')
          .setDescription(
    `✨ 歡迎來到星雨商店

    請使用下方選單購買商品`
          )
          .setImage(
    'https://cdn.discordapp.com/attachments/1501098193276895360/1503008880513253406/ChatGPT_Image_2026510_08_19_56.png'
          )
          .setFooter({
            text: 'Rain Shop System'
          })
          .setTimestamp()
      ],
      components: [shopRow]
    });

});

client.on(Events.InteractionCreate, async interaction => {

  // 不是按鈕就離開
  if (!interaction.isButton()) return;

  // 查詢星雨幣
  if (interaction.customId === 'check_coins') {

    const userId = interaction.user.id;

    const userData =
      await getUser(userId);

    return interaction.reply({
      content:
`💰 你目前有 ${userData.coins} 星雨幣`,
      flags: 64
    });

  }

  // 開啟轉帳
  if (interaction.customId === 'open_transfer') {

    const userMenu =
      new UserSelectMenuBuilder()
        .setCustomId('select_transfer_user')
        .setPlaceholder('選擇轉帳對象')
        .setMinValues(1)
        .setMaxValues(1);

    const row =
      new ActionRowBuilder()
        .addComponents(userMenu);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('💸 選擇轉帳對象')
          .setDescription('請選擇要轉帳的玩家')
      ],
      components: [row],
      flags: 64
    });

  } 

  // 每日簽到
    if (interaction.customId === 'daily_checkin') {

      const userId = interaction.user.id;

      const userData =
        await getUser(userId);

      const today =
        new Date().toDateString();

      if (userData.last_checkin === today) {

        return interaction.reply({
          content: '❌ 你今天已經簽到過了',
          flags: 64
        });

      }

      const newCoins =
        userData.coins + 10;

      await updateCoins(
        userId,
        newCoins
      );

      await updateCheckin(
        userId,
        today
      );

      return interaction.reply({
        content:
`✨ ${interaction.user.username} 簽到成功！

獲得 10 星雨幣 ☔`,
        flags: 64
      });

    }

});

client.on('messageCreate', async message => {

  if (message.author.bot) return;

  const random =
    Math.floor(Math.random() * 100);

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

      if (
        interaction.customId !== 'claim_rain'
      ) return;

      const userId =
        interaction.user.id;

      if (claimedUsers.includes(userId)) {

        return interaction.reply({
          content: '你已經領過了 ☔',
          flags: 64
        });

      }

      const userData =
        await getUser(userId);

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

      const newCoins =
        userData.coins + reward;

      await updateCoins(
        userId,
        newCoins
      );

      claimedUsers.push(userId);

      await interaction.reply({
        content:
`☔ 你搶到了 ${reward} 星雨幣！`,
        flags: 64
      });

      if (
        claimedUsers.length >= 10 ||
        remainingCoins <= 0
      ) {

        collector.stop();

        const disabledButton =
          ButtonBuilder.from(button)
            .setDisabled(true);

        await dropMessage.edit({
          content:
`☔ 星雨幣已被搶完！

總共 50 星雨幣 ✨`,
          components: [
            new ActionRowBuilder()
              .addComponents(disabledButton)
          ]
        });

      }

    });

  }

});

client.on(Events.InteractionCreate, async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  const userData =
    await getUser(userId);

// /ping
if (interaction.commandName === 'ping') {
  await interaction.reply('Pong!');
}

// /簽到
if (interaction.commandName === '簽到') {

  const userData =
    await getUser(userId);

  const today =
    new Date().toDateString();

  // 已經簽到過
  if (userData.last_checkin === today) {

    return interaction.reply({
      content: '❌ 你今天已經簽到過了',
      flags: 64
    });

  }

  const newCoins =
    userData.coins + 100;

  await updateCoins(
    userId,
    newCoins
  );

  await updateCheckin(
    userId,
    today
  );

  await interaction.reply(
    `✨ ${interaction.user.username} 獲得 100 星雨幣！`
  );

}

// /錢包
  if (interaction.commandName === '錢包') {


    await interaction.reply({
      content: `💰 你目前有 ${userData.coins} 星雨幣`,
     flags: 64
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
      flags: 64
    });
  }

  const target =
    interaction.options.getUser('玩家');

  const amount =
    interaction.options.getInteger('數量');

  const targetData =
    await getUser(target.id);

  const newCoins =
    targetData.coins + amount;

  await updateCoins(
    target.id,
    newCoins
  );

  await interaction.reply({
    content:
`✅ 已給予 ${target.username} ${amount} 星雨幣`,
    flags: 64
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
      flags: 64
    });
  }

  const target =
    interaction.options.getUser('玩家');

  const amount =
    interaction.options.getInteger('數量');


  const targetData =
    await getUser(target.id);

  let newCoins =
    targetData.coins - amount;

  if (newCoins < 0) {
    newCoins = 0;
  }

  await updateCoins(
    target.id,
    newCoins
  );

  await interaction.reply({
    content:
`❌ 已扣除 ${target.username} ${amount} 星雨幣`,
    flags: 64
  });

}

// /商店
if (interaction.commandName === '商店') {

  let text = '🛒 星雨商店\n\n';

    const shopData =
      await getShop();

    shopData.forEach(item => {

      text +=
    `✨ ${item.item_name} - ${item.price} 星雨幣\n`;

    });

  await interaction.reply({
    content: text,
    flags: 64
  });

}

// /購買
if (interaction.commandName === '購買') {

  const item =
    interaction.options.getString('商品');

  const { data: shopItem } =
    await supabase
      .from('shop')
      .select('*')
      .eq('item_name', item)
      .single();

  if (!shopItem) {
    return interaction.reply({
      content: '❌ 找不到這個商品',
      flags: 64
    });
  }

  const price = shopItem.price;

  if (userData.coins < price){
    return interaction.reply({
      content: '❌ 星雨幣不足',
      flags: 64
    });
  }

  const newCoins =
    userData.coins - price;

  await updateCoins(
    userId,
    newCoins
  );

  await interaction.reply({
    content:
`🛒 你購買了 ${item}！

花費 ${price} 星雨幣`,
    flags: 64
  });

}

// /新增商品
if (interaction.commandName === '新增商品') {

  if (
    interaction.guild.ownerId !== interaction.user.id
  ) {
    return interaction.reply({
      content: '❌ 只有群組擁有者可以使用',
      flags: 64
    });
  }

  const item =
    interaction.options.getString('商品');

  const price =
    interaction.options.getInteger('價格');

    await supabase
      .from('shop')
      .insert([
        {
          item_name: item,
          price: price
        }
      ]);
  await interaction.reply({
    content:
`✅ 已新增商品：

${item} - ${price} 星雨幣`,
    flags: 64
  });

}

// /刪除商品
if (interaction.commandName === '刪除商品') {

  if (
    interaction.guild.ownerId !== interaction.user.id
  ) {
    return interaction.reply({
      content: '❌ 只有群組擁有者可以使用',
      flags: 64
    });
  }

  const item =
    interaction.options.getString('商品');

  const { data: shopItem } =
    await supabase
      .from('shop')
      .select('*')
      .eq('item_name', item)
      .single();

  if (!shopItem) {
    return interaction.reply({
      content: '❌ 找不到這個商品',
      flags: 64
    });
  }

  await supabase
    .from('shop')
    .delete()
    .eq('item_name', item);

  await interaction.reply({
    content: 
`🗑️ 已刪除商品：${item}`,
      flags: 64
  });

}


// /交易紀錄
if (interaction.commandName === '交易紀錄') {

  const { data, error } =
    await supabase
      .from('transfers')
      .select('*')
      .or(
        `sender_id.eq.${userId},receiver_id.eq.${userId}`
      )
      .order('created_at', {
        ascending: false
      })
      .limit(10);

  if (error) {

    console.log(error);

    return interaction.reply({
      content: '❌ 讀取失敗',
      flags: 64
    });

  }

  if (!data || data.length === 0) {

    return interaction.reply({
      content: '目前沒有交易紀錄',
      flags: 64
    });

  }

  let text =
    '📜 最近交易紀錄\n\n';

  data.forEach(record => {

    const type =
      record.sender_id === userId
        ? '📤 匯出'
        : '📥 收入';

    const target =
      record.sender_id === userId
        ? record.receiver_id
        : record.sender_id;

    text +=
`${type}
對象：<@${target}>
金額：${record.amount} 星雨幣

`;

  });

  await interaction.reply({
    content: text,
    flags: 64
  });

}

// /排行榜
if (interaction.commandName === '排行榜') {
  const { data, error } =
    await supabase
      .from('users')
      .select('*')
      .order('coins', {
        ascending: false
      });

  if (error) {
    console.log(error);

    return interaction.reply({
      content: '❌ 排行榜讀取失敗',
      flags: 64
    });
  }

  if (!data || data.length === 0) {
    return interaction.reply({
      content: '目前還沒有排行榜資料',
      flags: 64
    });
  }

  let text = '🏆 星雨排行榜\n\n';

  data.slice(0, 10).forEach((user, index) => {

    text +=
`${index + 1}. <@${user.user_id}>
💰 ${user.coins} 星雨幣\n\n`;

  });

  await interaction.reply({
    content: text
  });

}

});

// 商店下拉選單
client.on(
  Events.InteractionCreate,
  async interaction => {

    if (!interaction.isStringSelectMenu()) return;

    if (
      interaction.customId === 'shop_select'
    ) {

      const itemName =
        interaction.values[0];

      const userId =
        interaction.user.id;

      const userData =
        await getUser(userId);

      // 讀取商品
      const { data: shopItem } =
        await supabase
          .from('shop')
          .select('*')
          .eq('item_name', itemName)
          .single();

      if (!shopItem) {

        return interaction.reply({
          content: '❌ 商品不存在',
          flags: 64
        });

      }

      // 錢不夠
      if (
        userData.coins < shopItem.price
      ) {

        return interaction.reply({
          content: '❌ 星雨幣不足',
          flags: 64
        });

      }

      // 扣款
      await updateCoins(
        userId,
        userData.coins - shopItem.price
      );

      // 隨機序號
      const code =
        Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();

      // 私訊玩家
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('🎁 購買成功')
            .setDescription(
`你購買了：

📦 ${itemName}

🔑 序號：
\`${code}\``
            )
        ]
      });

      // 回覆
      await interaction.reply({
        content:
`✅ 已購買 ${itemName}

序號已私訊給你`,
        flags: 64
      });

    }

});

// Modal 轉帳
client.on(
  Events.InteractionCreate,
  async interaction => {

    try {

      if (!interaction.isModalSubmit()) return;

      if (
        interaction.customId.startsWith(
          'transfer_modal_'
        )
      ) {

        console.log('收到轉帳Modal');

        const targetId =
          interaction.customId.replace(
            'transfer_modal_',
            ''
          );

        console.log('targetId:', targetId);

        const amount =
          parseInt(
            interaction.fields.getTextInputValue(
              'transfer_amount'
            )
          );

        console.log('amount:', amount);

        // 金額錯誤
        if (isNaN(amount) || amount <= 0) {

          return interaction.reply({
            content: '❌ 金額錯誤',
            flags: 64
          });

        }

        const senderId =
          interaction.user.id;

        // 不能轉自己
        if (senderId === targetId) {

          return interaction.reply({
            content: '❌ 不能轉帳給自己',
            flags: 64
          });

        }

        const senderData =
          await getUser(senderId);

        // 餘額不足
        if (senderData.coins < amount) {

          return interaction.reply({
            content: '❌ 餘額不足',
            flags: 64
          });

        }

        const targetData =
          await getUser(targetId);

        // 扣款
        await updateCoins(
          senderId,
          senderData.coins - amount
        );

        // 加款
        await updateCoins(
          targetId,
          targetData.coins + amount
        );

        // 新增交易紀錄
        await addTransferRecord(
          senderId,
          targetId,
          amount
        );

        // 嘗試通知
        try {

          const targetUser =
            await client.users.fetch(
              targetId
            );

          if (targetUser) {

            await targetUser.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('#57F287')
                  .setTitle('💸 收到星雨轉帳')
                  .setDescription(
`你收到了一筆新的星雨幣！

👤 來自：${interaction.user.username}
☔ 金額：${amount} 星雨幣`
                  )
                  .setTimestamp()
              ]
            }).catch(() => {
              console.log('玩家關閉私訊');
            });

          }

        } catch (err) {

          console.log('通知失敗');

        }
 
      return interaction.reply({
        content:
      `✅ 轉帳成功！

      💸 轉給 <@${targetId}>
      ☔ 金額：${amount} 星雨幣`,
        flags: 64
      });

      }

    } catch (err) {

      console.log('轉帳系統錯誤');

      console.log(err);

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {

        await interaction.reply({
          content:
            '❌ 系統錯誤，請稍後再試',
          flags: 64
        });

      }

    }

});

// 選擇轉帳對象
client.on(
  Events.InteractionCreate,
  async interaction => {

    if (!interaction.isUserSelectMenu()) return;

    if (
      interaction.customId ===
      'select_transfer_user'
    ) {

      const targetId =
        interaction.values[0];

      const modal =
        new ModalBuilder()
          .setCustomId(
            `transfer_modal_${targetId}`
          )
          .setTitle('星雨轉帳');

      const amountInput =
        new TextInputBuilder()
          .setCustomId('transfer_amount')
          .setLabel('輸入轉帳金額')
          .setStyle(
            TextInputStyle.Short
          )
          .setRequired(true);

      const row =
        new ActionRowBuilder()
          .addComponents(amountInput);

      modal.addComponents(row);

      await interaction.showModal(modal);

    }

});

// 商店下拉選單
client.on(
  Events.InteractionCreate,
  async interaction => {

    if (!interaction.isStringSelectMenu())
      return;

    if (
      interaction.customId !==
      'shop_select'
    ) return;

    const item =
      interaction.values[0];

    const userId =
      interaction.user.id;

    const userData =
      await getUser(userId);

    const { data: shopItem } =
      await supabase
        .from('shop')
        .select('*')
        .eq('item_name', item)
        .single();

    if (!shopItem) {

      return interaction.reply({
        content: '❌ 商品不存在',
        flags: 64
      });

    }

    if (
      userData.coins < shopItem.price
    ) {

      return interaction.reply({
        content: '❌ 星雨幣不足',
        flags: 64
      });

    }

    // 扣款
    const newCoins =
      userData.coins - shopItem.price;

    await updateCoins(
      userId,
      newCoins
    );

    // 生成序號
    const code =
      await createRedeemCode(100);

    // 回覆
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('#57F287')
          .setTitle('🛒 購買成功')
          .setDescription(
`商品：${item}

🎁 序號：
${code}

已扣除 ${shopItem.price} 星雨幣`
          )
      ],
      flags: 64
    });

});

client.login(process.env.TOKEN);
