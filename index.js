require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Command registration
const commands = [
  new SlashCommandBuilder()
    .setName('wikifetch')
    .setDescription('Fetches information from Wikipedia')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('The topic to look up')
        .setRequired(true)
    )
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// When the client is ready, run this code
client.once('ready', () => {
  console.log('Summon is online!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'wikifetch') {
    const topic = interaction.options.getString('topic');

    // Acknowledge the interaction
    await interaction.deferReply();

    try {
      // Fetch from Wikipedia API
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
      );

      if (!response.ok) {
        await interaction.editReply('Sorry, I couldn\'t find information about that topic.');
        return;
      }

      const data = await response.json();

      // Send the result
      await interaction.editReply({
        embeds: [{
          title: data.title,
          description: data.extract,
          color: 0x9678b6, // Purple color
          url: data.content_urls.desktop.page,
          footer: {
            text: 'Information from Wikipedia'
          }
        }]
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply('Sorry, something went wrong while fetching the information.');
    }
  }
});

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);
