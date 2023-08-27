// Turtle Race!
// !race to start a turtle race

require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");
const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');

// connect to discord
const client = new Discord.Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_MEMBERS"
  ],
});

// connect to OpenAI 
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// setup chatbot variables
const maxMemory = 6;
const botMemory = [];
const prefix = '!';
let raceNumber = 0;
let raceInProgress = false;

// start chatbot
client.once('ready', async () => {
  client.user.setActivity("turtles race", { type: "WATCHING" })
  console.log('Bot is online');
});

// on message...
client.on('messageCreate', message => {

  // reply to a message if bot is being replied to
  if (message.reference && message.reference.messageId) {

    message.channel.messages.fetch(message.reference.messageId)
      .then(msg => {
        if (msg.author.id === client.user.id) {

          // Reply to the message
          // set chatbot prompt as discord message
          let prompt = message.content;

          // generate response
          (async () => {
            try {
              const chatMessages = [
                { "role": "system", "content": "You are a National Turtle Racing League sports commentator." },
                ...botMemory,
                { "role": "user", "content": prompt }
              ];

              const completion = await openai.createChatCompletion({
                model: "gpt-4",
                messages: chatMessages,
                temperature: 1.1,
                max_tokens: 500,
                presence_penalty: 0.5,
                frequency_penalty: 0.2
              });

              const response = completion.data.choices[0].message.content;

              message.reply(response);
              if (botMemory.length >= maxMemory * 2) {
                botMemory.splice(0, 2);
              }
              botMemory.push({ "role": "user", "content": prompt });
              botMemory.push({ "role": "assistant", "content": response });

            } catch (e) {
              console.log('error: ', e);
              message.reply('Sam does not approve!');
            }
          })();
        }
      })
      .catch(console.error);
  }

  // commands
  if (message.content.startsWith(prefix)) {
    const [command, ...args] = message.content
      .trim()
      .substring(prefix.length)
      .split(/\s+/);

    switch (command) {

      // turtle race
      case 'race':

        if (raceInProgress) {
          message.channel.send("Turtles are already racing on the track!");
          return;
        }

        const turtle_count = 5;
        const race_length = 100;
        const race_interval = 1000;
        raceNumber++;
        let lastMessage = null;

        const names = [
          'Rocky', 'Shellman', 'Speedy', 
          'Bolt', 'Flash', 'Turbo', 'Rocket', 
          'Zoom', 'Blaze', 'Jet', 'Comet', 'Lightning', 
          'Rapido', 'Viento', 'Fugaz', 'Cósmico', 'Relâmpago', 
          'Raio', 'Contella', 'Torbellino', 'Águila', 'Faísca'
        ];
        const emojis = ['🟥', '🟦', '🟩', '🟨', '🟪', '🟫', '🟧', '⬛', '⬜'];

        // Shuffle array
        function shuffleArray(array) {
          for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
        }

        // Randomly select and shuffle names
        shuffleArray(names);
        shuffleArray(emojis)
        const randomNames = names.slice(0, turtle_count);
        const randomEmojis = emojis.slice(0, turtle_count);

        let turtles = Array(turtle_count).fill(0);
        let raceTime = 0;

        function randomMove() {
          const turtle_index = Math.floor(Math.random() * turtle_count); // select a random turtle
          const turtleStep = Math.ceil(Math.random() * 10); // set a random step count
          const move = Math.random() > 0.5 ? turtleStep : -(Math.floor(turtleStep/3)); // move forward or backward

          turtles[turtle_index] = Math.max(0, turtles[turtle_index] + move);
          raceTime++;

          let turtlesPositions = turtles.map((turtle, index) => ({
            name: randomNames[index],
            emoji: randomEmojis[index],
            pos: turtle,
            racePercentage: (turtle / race_length * 100).toFixed(0) // calculate race completion percentage
          }));

          let positionsName = turtlesPositions.map(turtle => turtle.name.padEnd(12, '-'));
          let positionsPercentage = turtlesPositions.map(turtle => `${turtle.racePercentage}%`);

          let positionsPercentageAsInt0 = parseInt(positionsPercentage[0])/5;
          let displayPositionString0 = '--------------------'.substring(0, 20 - positionsPercentageAsInt0) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt0 + 1);

          let positionsPercentageAsInt1 = parseInt(positionsPercentage[1])/5;
          let displayPositionString1 = '--------------------'.substring(0, 20 - positionsPercentageAsInt1) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt1 + 1);

          let positionsPercentageAsInt2 = parseInt(positionsPercentage[2])/5;
          let displayPositionString2 = '--------------------'.substring(0, 20 - positionsPercentageAsInt2) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt2 + 1);

          let positionsPercentageAsInt3 = parseInt(positionsPercentage[3])/5;
          let displayPositionString3 = '--------------------'.substring(0, 20 - positionsPercentageAsInt3) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt3 + 1);

          let positionsPercentageAsInt4 = parseInt(positionsPercentage[4])/5;
          let displayPositionString4 = '--------------------'.substring(0, 20 - positionsPercentageAsInt4) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt4 + 1);

          if (raceTime % 2 === 0) {

          let raceMessage = `\n
${positionsName[0]} ${turtlesPositions[0].emoji} 🏁 ${displayPositionString0}
${positionsName[1]} ${turtlesPositions[1].emoji} 🏁 ${displayPositionString1}
${positionsName[2]} ${turtlesPositions[2].emoji} 🏁 ${displayPositionString2}
${positionsName[3]} ${turtlesPositions[3].emoji} 🏁 ${displayPositionString3}
${positionsName[4]} ${turtlesPositions[4].emoji} 🏁 ${displayPositionString4}
            `;
            if (lastMessage) {
              lastMessage.edit(raceMessage);
            } else {
              message.channel.send(raceMessage)
                .then(msg => lastMessage = msg);
            }
          }

          turtlesPositions.sort((a, b) => b.pos - a.pos);
          let winMessage = `🍾 We have a winner! 🎉\n🐢 Turtle Race #${raceNumber}\n🥇 ${turtlesPositions[0].name} at ${turtlesPositions[0].racePercentage} complete\n🥈 ${turtlesPositions[1].name} at ${turtlesPositions[1].racePercentage} complete\n🥉 ${turtlesPositions[2].name} at ${turtlesPositions[2].racePercentage} complete\n😰 ${turtlesPositions[3].name} at ${turtlesPositions[3].racePercentage} complete\n😴 ${turtlesPositions[4].name} at ${turtlesPositions[4].racePercentage} complete`
          return turtles[turtle_index] >= race_length ? winMessage : null; // if a turtle reaches or surpasses the race_length, it wins
        }

        message.channel.send(`🐢 Turtle race #${raceNumber} has begun!`);
        raceInProgress = true;

        const raceInterval = setInterval(() => {
          const winner = randomMove();
          if (winner !== null) {
            message.channel.send(`\n${winner}`);
            clearInterval(raceInterval);
            raceInProgress = false;
          }
        }, race_interval);

        break;

        case 'welcome':
          message.channel.send({ embeds: [welcomeEmbed] });
        break;
      default:
        message.reply('There is only one command!');
        break;
    }
  }



});

const welcomeEmbed = new MessageEmbed()
.setColor('#17a80b')
.setTitle('Welcome to the Turtle Race!')
.setAuthor({ name: 'jahhweh', iconURL: 'https://cdn.discordapp.com/attachments/1145141142082560012/1145146701057888266/jahhweh.gif' })
.setDescription("Turtle Race has only 1 command: \n`!race` to start a turtle race \n\n🏁----------------🐢----------\n🏁--------------🐢------------\n🏁---------🐢-----------------\n🏁---------------------🐢-----\n🏁------🐢--------------------")

client.login(process.env.DISCORD_BOT_TOKEN);
