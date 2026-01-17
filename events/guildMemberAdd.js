const Guild = require('../models/guild');
const { serverLogChannelId } = require('../config/logs.json');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const dbGuild = await Guild.findOne({ where: { id: member.guild.id } });

        if (dbGuild && dbGuild.welcomeChannelId) {
            const welcomeChannel = await member.guild.channels.fetch(dbGuild.welcomeChannelId).catch(() => null);
            if (welcomeChannel) {
                welcomeChannel.send(`Welcome to the server ${member.user}`);
            }
        }

        try {
            const logChannel = await member.guild.channels.fetch(serverLogChannelId).catch(() => null);
            if (!logChannel) return;

            const accountAge = Date.now() - member.user.createdTimestamp;
            const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('📥 Member Joined')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    {
                        name: 'User',
                        value: `${member.user.tag} (\`${member.user.id}\`)`,
                        inline: true
                    },
                    {
                        name: 'Account Created',
                        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                        inline: true
                    },
                    {
                        name: 'Account Age',
                        value: `${accountAgeDays} days`,
                        inline: true
                    },
                    {
                        name: 'Member Count',
                        value: `${member.guild.memberCount}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${member.user.id}` });

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Member join log error:', error);
        }
    }
}