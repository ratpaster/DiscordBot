const { token, ownerID, guildID, clientID, geniusAccessToken } = require('./config/config.json');
const { Client, Events, GatewayIntentBits, ActivityType, Collection, EmbedBuilder } = require('discord.js');
const Genius = require('genius-lyrics');

const fs = require('node:fs');
const path = require('node:path');

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

const eventFiles = fs.readdirSync('./events/logs').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/logs/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once(Events.ClientReady, async c => {
    console.log(`${c.user.tag} has logged in`);
    c.user.setActivity({name: 'IN DEVELOPMENT', type: ActivityType.Custom})

    setInterval(() => {
        const currentStatus = c.user.presence.status;
        const newStatus = currentStatus === 'dnd' ? 'idle' : 'dnd';
        c.user.setPresence({ status: newStatus });
    }, 5000);

    await cleanupBlackjackGames();
});

client.login(token);

const Infraction = require('./models/infraction')
const Member = require('./models/member')
const Guild = require('./models/guild');
const Level = require('./models/level');
const BlackjackGame = require('./models/blackjackGame');

Member.hasMany(Infraction);
Infraction.belongsTo(Member);

(async () => {
    await Guild.sync({ alter: true });
    await Member.sync({ alter: true });
    await Infraction.sync({ alter: true });
    console.log('✅ Database tables synced');
})();

async function cleanupBlackjackGames() {
    try {
        const activeGames = await BlackjackGame.findAll({
            where: { status: 'active' }
        });

        for (const game of activeGames) {
            const userLevel = await Level.findOne({
                where: { userId: game.userId, guildId: game.guildId }
            });

            if (userLevel) {
                userLevel.xp += game.betAmount;
                await userLevel.save();
            }

            await game.destroy();
        }

        if (activeGames.length > 0) {
            console.log(`🃏 Cleaned up ${activeGames.length} active blackjack game(s) and refunded XP`);
        }
    } catch (error) {
        console.error('Error cleaning up blackjack games:', error);
    }
}

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