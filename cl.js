const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientID, guildID, token } = require('./config/config.json');

const rest = new REST({ version: '10'}).setToken(token);

(async () => {
    try {
        const commands = await rest.get( Routes.applicationGuildCommands(clientID, guildID) );

        // Delete each existing command
        for (const command of commands) {
            await rest.delete(Routes.applicationGuildCommand(clientID, guildID, command.id));
            console.log(`Command ${command.name} deleted successfully`);
        }
        console.log(commands)
        for(let i = 0; i < commands.length; i++) {
            await rest.delete(Routes.applicationGuildCommand(clientID, guildID, commands[i].id));
            console.log(`Command ${commands[i].name} deleted successfully`);
        }

    } catch (error) {
        console.error('Error fetching existing commands:', error);
    }
})();