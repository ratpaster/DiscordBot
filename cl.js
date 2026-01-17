const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientID, guildID, token } = require('./config/config.json');

const rest = new REST({ version: '10'}).setToken(token);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    try {
        console.log('Clearing ALL commands (guild AND global)...');
        
        await rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: [] });
        console.log('✅ Cleared all guild commands');
        
        await sleep(1000);
        
        await rest.put(Routes.applicationCommands(clientID), { body: [] });
        console.log('✅ Cleared all global commands');

        console.log('✅ All commands cleared!');

    } catch (error) {
        console.error('Error clearing commands:', error);
    }
})();