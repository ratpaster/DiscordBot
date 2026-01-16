// necessary imports
const { token, ownerID, guildID, clientID, geniusAccessToken } = require('./config/config.json');
const { Client, Events, GatewayIntentBits, ActivityType, Collection, EmbedBuilder } = require('discord.js');
const Genius = require('genius-lyrics');

const fs = require('node:fs');
const path = require('node:path');

//process.exit(1);

// new client from djs
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent
    ]
  });
client.commandFiles = new Map();
client.commands = getCommands('./commands');

const genius = new Genius.Client(geniusAccessToken);

client.on(Events.InteractionCreate, interaction => {
    
    if (!interaction.isChatInputCommand()) return;

    let command = client.commands.get(interaction.commandName);

    try {
        if(interaction.replied) return;
        command.execute(interaction, client, genius);
    } catch (error) {
        console.error(error);
    }
})

client.once(Events.ClientReady, c => {
    console.log(`${c.user.tag} has logged in`);
    c.user.setActivity({name: /*'Swimming with the dead'*/'IN DEVELOPMENT', type: ActivityType.Custom})

    setInterval(() => {
        const currentStatus = c.user.presence.status;
        const newStatus = currentStatus === 'dnd' ? 'idle' : 'dnd';
        c.user.setPresence({ status: newStatus });
        }, 5000);
});
client.login(token);


// Functions and DBs
const Infraction = require('./models/infraction')
const Member = require('./models/member')
const Level = require('./models/level');
const BlackjackGame = require('./models/blackjackGame');
const BlackjackStats = require('./models/blackjackStats');

BlackjackGame.sync();
BlackjackStats.sync();

Level.sync();

client.on(Events.MessageCreate, async (message) => {
    const messageCreateEvent = require('./events/messageCreate');
    messageCreateEvent.execute(message);
});

Member.hasMany(Infraction);
Infraction.belongsTo(Member);

function getCommands(dir) {
    let commands = new Collection();
    const commandFiles = getFiles(dir);

    for(const commandFile of commandFiles) {
        const commandPath = path.resolve(__dirname, commandFile);
        const command = require(commandPath);
        commands.set(command.data.toJSON().name, command);
        client.commandFiles.set(command.data.toJSON().name, commandFile);
    }

    return commands;
}

function getFiles(dir) {
    const files = fs.readdirSync(dir, {
        withFileTypes: true
    });
    let commandFiles = [];

    for(const file of files) {
        if(file.isDirectory()) {
            commandFiles = [
                ...commandFiles,
                ...getFiles(`${dir}/${file.name}`)
            ]
        } else if (file.name.endsWith(".js")) {
            commandFiles.push(`${dir}/${file.name}`);
        }
    }

    return commandFiles;
}