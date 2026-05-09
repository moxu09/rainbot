require('dotenv').config();

const {
REST,
Routes,
SlashCommandBuilder
} = require('discord.js');

const commands = [

new SlashCommandBuilder()
.setName('ping')
.setDescription('測試機器人'),

new SlashCommandBuilder()
.setName('簽到')
.setDescription('每日領取星雨幣'),

new SlashCommandBuilder()
  .setName('錢包')
  .setDescription('查看你的星雨幣'),

new SlashCommandBuilder()
  .setName('排行榜')
  .setDescription('查看星雨幣排行榜'),

new SlashCommandBuilder()
  .setName('給予')
  .setDescription('給予玩家星雨幣')
  .addUserOption(option =>
    option
      .setName('玩家')
      .setDescription('選擇玩家')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('數量')
      .setDescription('星雨幣數量')
      .setRequired(true)
  ),

new SlashCommandBuilder()
  .setName('扣除')
  .setDescription('扣除玩家星雨幣')
  .addUserOption(option =>
    option
      .setName('玩家')
      .setDescription('選擇玩家')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('數量')
      .setDescription('星雨幣數量')
      .setRequired(true)
  ),


new SlashCommandBuilder()
  .setName('商店')
  .setDescription('查看星雨商店'),

new SlashCommandBuilder()
  .setName('購買')
  .setDescription('購買商品')
  .addStringOption(option =>
    option
      .setName('商品')
      .setDescription('輸入商品名稱')
      .setRequired(true)
  ),

new SlashCommandBuilder()
  .setName('新增商品')
  .setDescription('新增商店商品')
  .addStringOption(option =>
    option
      .setName('商品')
      .setDescription('商品名稱')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('價格')
      .setDescription('商品價格')
      .setRequired(true)
  ),

new SlashCommandBuilder()
  .setName('刪除商品')
  .setDescription('刪除商店商品')
  .addStringOption(option =>
    option
      .setName('商品')
      .setDescription('商品名稱')
      .setRequired(true)
  ),

].map(command => command.toJSON());

const rest = new REST({ version: '10' })
.setToken(process.env.TOKEN);

(async () => {

try {


console.log('開始部署指令');

await rest.put(
  Routes.applicationCommands(
    process.env.CLIENT_ID
  ),
  { body: commands }
);

console.log('指令部署成功');


} catch (error) {
console.error(error);
}

})();

