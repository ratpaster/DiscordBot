const { ActivityType, SlashCommandBuilder } = require('discord.js');
module.exports = {
    name: 'ready',
    once: 'true',
    async execute(client) {

        console.log(`${client.user.tag} has logged in`);
        client.user.setActivity({name: 'Swimming with the dead', type: ActivityType.Custom})

        setInterval(() => {
            const currentStatus = client.user.presence.status;
            const newStatus = currentStatus === 'dnd' ? 'idle' : 'dnd';
            client.user.setPresence({ status: newStatus });
          }, 5000);
    }
}