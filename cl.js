const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientID, guildID, token } = require('./config/config.json');

const rest = new REST({ version: '10'}).setToken(token);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    try {
        console.log('Fetching commands...');
        const commands = await rest.get(Routes.applicationGuildCommands(clientID, guildID));

        console.log(`Found ${commands.length} commands to delete.`);

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            await rest.delete(Routes.applicationGuildCommand(clientID, guildID, command.id));
            console.log(`✅ Deleted command ${i + 1}/${commands.length}: ${command.name}`);
            
            await sleep(500);
        }

        console.log('✅ All commands deleted successfully!');

    } catch (error) {
        console.error('Error deleting commands:', error);
    }
})();