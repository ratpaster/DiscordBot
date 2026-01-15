const Guild = require('../models/guild'); // find database 'guild.js'

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        
        const dbGuild = await Guild.findOne({ where: { id: member.guild.id } }); // get specific db value

        if(dbGuild.welcomeChannelId) {

            const welcomeChannel = await member.guild.channels.fetch(dbGuild.welcomeChannelId);
            welcomeChannel.send(`Welcome to the server ${member.user}`); // welcome message (need embed)

        }
    }
}