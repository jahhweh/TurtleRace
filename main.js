// Turtle Race!
// !race to start a turtle race

import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { Client } from 'discord.js';

dotenv.config();
const client = new Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_MEMBERS"
  ],
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// setup chatbot variables
const maxMemory = 2;
const botMemory = [];
let raceInProgress = false;
const maxRaceMemory = 20;
const raceMemory = [];
const prefix = '!';
const botChannel = '1145140514107183136';

// start chatbot
client.once('ready', async () => {
  client.user.setActivity("turtles race", { type: "WATCHING" })
});

// on message...
client.on('messageCreate', async (message) => {

  // if message is not in bot channel, ignore it
  if (!message.channel.id == botChannel) return;

  // reply to a message if bot is being replied to
  if (message.reference && message.reference.messageId) {
    message.channel.messages.fetch(message.reference.messageId)
      .then(async msg => {
        if (msg.author.id === client.user.id) {
          let prompt = message.content;
          const modCheck = openai.moderations.create({
            model: 'text-moderation-latest',
            input: prompt
          })
          const banHammer = (await modCheck).results[0].flagged;
          if (banHammer) {
            message.reply("That was flagged by the moderators. Please !chat about something else.");
            return;
          }
          (async () => {
            try {
              const chatMessages = [
                { "role": "system", "content": "You are an International Turtle Racing League sports commentator." },
                ...botMemory,
                { "role": "user", "content": prompt }
              ];
              const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo-16k",
                messages: chatMessages,
                temperature: 0.6,
                max_tokens: 500,
                presence_penalty: 0.5,
                frequency_penalty: 0.1
              });
              const response = completion.choices[0].message.content;
              message.reply(response);
              if (botMemory.length >= maxMemory * 2) {
                botMemory.splice(0, 2);
              }
              botMemory.push({ "role": "user", "content": prompt });
              botMemory.push({ "role": "assistant", "content": response });
            } catch (e) {
              console.log('error: ', e);
              message.reply('error...');
              message.reply(e);
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

      case 'chat':
        try {
          let chatPrompt = message.content.replace("!chat ", " ");
          const modCheck = openai.moderations.create({
            model: 'text-moderation-latest',
            input: chatPrompt
          })
          const banHammer = (await modCheck).results[0].flagged;
          if (banHammer) {
            message.reply("That was flagged by the moderators. Please !chat about something else.");
            return;
          }
          (async () => {
            try {
              const chatMessages = [
                { "role": "system", "content": "You are an International Turtle Racing League sports commentator." },
                ...botMemory,
                { "role": "user", "content": chatPrompt }
              ];
              const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo-16k",
                messages: chatMessages,
                temperature: 0.6,
                max_tokens: 500,
                presence_penalty: 0.5,
                frequency_penalty: 0.1
              });
              const response = completion.choices[0].message.content;
              message.reply(response);
              if (botMemory.length >= maxMemory * 2) {
                botMemory.splice(0, 2);
              }
              botMemory.push({ "role": "user", "content": chatPrompt });
              botMemory.push({ "role": "assistant", "content": response });
            } catch (e) {
              console.log('error: ', e);
              message.reply('error...');
              message.reply(e);
            }
          })();
        } catch (e) {
          console.log('Error... ', e);
          message.reply(`Error... ${e}`);
        }

        break;

      case 'addTurtle':

        const newTurtleName = message.content.slice(message.content.indexOf('!addTurtle') + 11).replace(/[*]/g, '');

        if (newTurtleName.length <= 2 || newTurtleName.length >= 12) {
          message.reply("Turtle names must be between 2 and 12 characters. `!addTurtle **name**`");
          return;
        }

        const modCheck = openai.moderations.create({
          model: 'text-moderation-latest',
          input: newTurtleName
        })
        const banHammer = (await modCheck).results[0].flagged;
        if (banHammer) {
          message.reply("That name was flagged by the moderators. Please choose a different name.");
          return;
        }

        try {
          const userRef = doc(db, "users", message.author.id);
          const userDoc = await getDoc(userRef);

          const globalRef = doc(db, "turtlerace", "global");
          const turtlesRef = doc(db, "turtles", newTurtleName);

          if (!userDoc.exists()) {
            const timestamp = Math.floor(Date.now()).toString();
            await setDoc(userRef, {
              username: message.author.username,
              signUpTimestamp: timestamp,
              turtleName: newTurtleName
            });
          }

          const myTurtleName = userDoc.data()?.turtleName;
          if (myTurtleName) {
            message.reply(`You already have a turtle named ${myTurtleName}.`);
            return;
          }

          await updateDoc(globalRef, {
            turtleNames: arrayUnion(newTurtleName)
          });

          await setDoc(turtlesRef, {
            owner: message.author.username,
            plays: 0,
            wins: 0
          });

          await updateDoc(userRef, {
            turtleName: newTurtleName
          });
          message.reply(`Your turtle is named ${newTurtleName}.`)
        } catch (e) {
          console.log('error... ', e);
          message.reply(`Error... ${e}`);
        }
        break;

      case 'myTurtle':
        try {
          const userRef = doc(db, "users", message.author.id);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            const timestamp = Math.floor(Date.now()).toString();
            await setDoc(userRef, {
              username: message.author.username,
              signUpTimestamp: timestamp,
            });
            message.reply("You don't have a turtle. You can add one with the command `!addTurtle **name**`");
            return;
          }

          const myTurtleName = await userDoc.data().turtleName;
          if (!myTurtleName) {
            message.reply("You don't have a turtle. You can add one with the command `!addTurtle **name**`");
            return;
          }

          const turtlesRef = doc(db, "turtles", myTurtleName);
          const turtlesDoc = await getDoc(turtlesRef);

          const turtleData = turtlesDoc.data();
          console.log(turtleData)

          const owner = turtleData.owner;
          const plays = turtleData.plays;
          const wins = turtleData.wins;

          message.reply(`🐢 Name: ${myTurtleName}\n ❤️ Owner: ${owner}\n 🏁 Races: ${plays}\n 🥇 Wins: ${wins}`)

        } catch (e) {
          console.log('error... ', e);
          message.reply('Error... ', e);
        }

        break;

      case 'race':
        try {

          const timezoneOptions = {
            hour12: true,
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          };

          let clientDateAndTime = new Date().toLocaleString(undefined, timezoneOptions);

          const userRef = doc(db, "users", message.author.id);
          const userDoc = await getDoc(userRef);
          const globalRef = doc(db, "turtlerace", "global");
          const globalDoc = await getDoc(globalRef);

          if (!userDoc.exists()) {
            const timestamp = Math.floor(Date.now()).toString();
            await setDoc(userRef, {
              username: message.author.username,
              signUpTimestamp: timestamp,
            });
          }

          if (raceInProgress) {
            message.channel.send("Turtles are already racing on the track!");
            return;
          }

          const turtleNamesArray = globalDoc.data().turtleNames;
          const turtleRaceNumber = globalDoc.data().totalTurtleRaces;

          await updateDoc(globalRef, {
            totalTurtleRaces: increment(1)
          });

          const turtle_count = 5;
          const race_length = 100;
          const race_interval = 1000;
          let lastMessage = null;
          let lastUpdate = null;

          const emojis = ['🟥', '🟦', '🟩', '🟨', '🟪', '🟫', '🟧', '⬛', '⬜'];

          // Shuffle array
          function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
              let j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
            }
          }

          // Randomly select and shuffle names
          shuffleArray(turtleNamesArray);

          shuffleArray(emojis);
          const randomNames = turtleNamesArray.slice(0, turtle_count);
          const randomEmojis = emojis.slice(0, turtle_count);

          let turtles = Array(turtle_count).fill(0);
          let raceTime = 0;

          function randomMove() {
            const turtle_index = Math.floor(Math.random() * turtle_count); // select a random turtle
            const turtleStep = Math.ceil(Math.random() * 10); // set a random step count
            const move = Math.random() > 0.5 ? turtleStep : -(Math.floor(turtleStep / 3)); // move forward or backward
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

            let positionsPercentageAsInt0 = parseInt(positionsPercentage[0]) / 5;
            let displayPositionString0 = '--------------------'.substring(0, 20 - positionsPercentageAsInt0) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt0 + 1);

            let positionsPercentageAsInt1 = parseInt(positionsPercentage[1]) / 5;
            let displayPositionString1 = '--------------------'.substring(0, 20 - positionsPercentageAsInt1) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt1 + 1);

            let positionsPercentageAsInt2 = parseInt(positionsPercentage[2]) / 5;
            let displayPositionString2 = '--------------------'.substring(0, 20 - positionsPercentageAsInt2) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt2 + 1);

            let positionsPercentageAsInt3 = parseInt(positionsPercentage[3]) / 5;
            let displayPositionString3 = '--------------------'.substring(0, 20 - positionsPercentageAsInt3) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt3 + 1);

            let positionsPercentageAsInt4 = parseInt(positionsPercentage[4]) / 5;
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
            if (raceTime === 1 || raceTime % 20 === 0) {
              raceUpdate();
            }

            turtlesPositions.sort((a, b) => b.pos - a.pos);

            let turtleRef0 = doc(db, "turtles", turtlesPositions[0].name);
            let turtleRef1 = doc(db, "turtles", turtlesPositions[1].name);
            let turtleRef2 = doc(db, "turtles", turtlesPositions[2].name);
            let turtleRef3 = doc(db, "turtles", turtlesPositions[3].name);
            let turtleRef4 = doc(db, "turtles", turtlesPositions[4].name);

            if (turtles[turtle_index] >= race_length) {
              setDoc(turtleRef0, {
                plays: increment(1),
                wins: increment(1)
              },
                { merge: true });
              setDoc(turtleRef1, {
                plays: increment(1)
              },
                { merge: true });
              setDoc(turtleRef2, {
                plays: increment(1)
              },
                { merge: true });
              setDoc(turtleRef3, {
                plays: increment(1)
              },
                { merge: true });
              setDoc(turtleRef4, {
                plays: increment(1)
              },
                { merge: true });
            }

            if (!turtleRaceNumber) {
              let winMessage = `🍾 We have a winner! 🎉\n🐢 Turtle Race #1\n🥇 ${turtlesPositions[0].name}\n🥈 ${turtlesPositions[1].name}\n🥉 ${turtlesPositions[2].name}\n😰 ${turtlesPositions[3].name}\n😴 ${turtlesPositions[4].name}`
              return turtles[turtle_index] >= race_length ? winMessage : null;
            } else {
              let winMessage = `🍾 We have a winner! 🎉\n🐢 Turtle Race #${turtleRaceNumber + 1}\n🥇 ${turtlesPositions[0].name}\n🥈 ${turtlesPositions[1].name}\n🥉 ${turtlesPositions[2].name}\n😰 ${turtlesPositions[3].name}\n😴 ${turtlesPositions[4].name}`
              return turtles[turtle_index] >= race_length ? winMessage : null;
            }
          }

          function raceUpdate() {
            let turtlesPositions = turtles.map((turtle, index) => ({
              name: randomNames[index],
              emoji: randomEmojis[index],
              pos: turtle,
              racePercentage: (turtle / race_length * 100).toFixed(0)
            }));
            let turtlesPositionsJSON = JSON.stringify(turtlesPositions.map(turtle => {
              return {
                name: turtle.name,
                percentComplete: turtle.racePercentage
              };
            }));
            let instructions = `The message delimited by ### is an update for a turtle race. The first turtle to percentComplete 100% wins. Very briefly describe the turtle race update with a random fact about the race track or a racer. ###\n${turtlesPositionsJSON}\n###`;
            (async () => {
              try {
                const chatMessages = [
                  { "role": "system", "content": "You are an International Turtle Racing League sports commentator." },
                  ...raceMemory,
                  { "role": "user", "content": instructions }
                ];
                const completion = await openai.chat.completions.create({
                  model: "gpt-3.5-turbo-16k",
                  messages: chatMessages,
                  temperature: 0.9,
                  max_tokens: 500,
                  presence_penalty: 0.5,
                  frequency_penalty: 0.1
                });
                const response = completion.choices[0].message.content;

                if (lastUpdate) {
                  lastUpdate.edit(`🎙️ ${response}`);
                } else {
                  message.channel.send(`🎙️ ${response}`)
                    .then(msg => lastUpdate = msg);
                }

                if (raceMemory.length >= maxRaceMemory * 2) {
                  raceMemory.splice(0, 2);
                }
                raceMemory.push({ "role": "user", "content": instructions });
                raceMemory.push({ "role": "assistant", "content": response });
              } catch (e) {
                console.log('error: ', e);
                message.channel.send('🎙️ Oops, hang on one second... I thin.. can g.t...a.ah.***cchhhhhhhhhh***!');
              }
            })();
          }

          if (!turtleRaceNumber) {
            message.channel.send(`🐢 It's ${clientDateAndTime} and this is Turtle Race #1!`);
          } else {
            message.channel.send(`🐢 It's ${clientDateAndTime} and this is Turtle Race #${turtleRaceNumber + 1}!`);
          }
          raceInProgress = true;

          const raceInterval = setInterval(() => {
            const winner = randomMove();
            if (winner !== null) {
              message.channel.send(`\n${winner}`);
              let raceResultsJSON = JSON.stringify(winner)
              let finalMessage = `The message delimited by ### are the results of a turtle race. Very briefly describe the results. ###\n${raceResultsJSON}\n###`;

              (async () => {
                try {
                  const chatMessages = [
                    { "role": "system", "content": "You are an International Turtle Racing League sports commentator." },
                    ...raceMemory,
                    { "role": "user", "content": finalMessage }
                  ];
                  const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo-16k",
                    messages: chatMessages,
                    temperature: 0.9,
                    max_tokens: 500,
                    presence_penalty: 0.5,
                    frequency_penalty: 0.1
                  });
                  const response = completion.choices[0].message.content;

                  if (lastUpdate) {
                    lastUpdate.edit(`🎙️ ${response}`);
                  } else {
                    message.channel.send(`🎙️ ${response}`)
                      .then(msg => lastUpdate = msg);
                  }

                } catch (e) {
                  console.log('error: ', e);
                  message.channel.send('🎙️ Oops, hang on one second... I thin.. can g.t...a.ah.***cchhhhhhhhhh***!');
                }
              })();
              clearInterval(raceInterval);
              raceInProgress = false;
            }
          }, race_interval);

        } catch (e) {
          console.log('Error... ', e);
          message.reply(`Error... ${e}`);
        }

        break;

      case 'help':
        message.reply(
          "Turtle Race Commands\n\n" +
          "🐢 `!race` Start a turtle race \n" +
          "🆕 `!addTurtle **name**` Add a turtle to the International Turtle Racing League\n" +
          "📊 `!myTurtle` Check your turtle stats\n" +
          "💬 `!chat` Start a chat with the commentator\n"
        )
        break;

      default:
        message.reply('That is not a command!');
        break;
    }
  }

});

client.login(process.env.DISCORD_BOT_TOKEN);
