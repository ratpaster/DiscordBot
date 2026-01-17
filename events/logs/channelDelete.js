const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { serverLogChannelId } = require('../../config/logs.json');

module.exports = {
    name: 'channelDelete',
    async execute(channel) {
        if (!channel.guild) return;

        try {
            const logChannel = await channel.guild.channels.fetch(serverLogChannelId).catch(() => null);
            if (!logChannel) return;

            const fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.ChannelDelete,
            });
            const channelLog = fetchedLogs.entries.first();

            let executor = 'Unknown';
            if (channelLog && channelLog.target.id === channel.id &&
                channelLog.createdTimestamp > (Date.now() - 5000)) {
                executor = channelLog.executor.tag;
            }

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🗑️ Channel Deleted')
                .addFields(
                    {
                        name: 'Channel',
                        value: `${channel.name} (\`${channel.id}\`)`,
                        inline: true
                    },
                    {
                        name: 'Type',
                        value: `${channel.type}`,
                        inline: true
                    },
                    {
                        name: 'Deleted By',
                        value: executor,
                        inline: true
                    }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Channel delete log error:', error);
        }
    }
}