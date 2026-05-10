require('dotenv').config();

const { REST, Routes } =
  require('discord.js');

const commands = [

  {
    name: '交易紀錄',
    description: '查看最近交易紀錄'
  }

];

const rest = new REST({
  version: '10'
}).setToken(process.env.TOKEN);

(async () => {

  try {

    console.log('開始註冊指令');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('指令註冊成功');

  } catch (error) {

    console.log(error);

  }

})()
