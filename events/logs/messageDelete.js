const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { serverLogChannelId } = require('../../config/logs.json');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        if (!message.guild || message.author?.bot) return;

        try {
            const logChannel = await message.guild.channels.fetch(serverLogChannelId).catch(() => null);
            if (!logChannel) return;

            let deletedBy = 'Unknown';
            const fetchedLogs = await message.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MessageDelete,
            });
            const deletionLog = fetchedLogs.entries.first();

            if (deletionLog && deletionLog.target.id === message.author?.id &&
                deletionLog.createdTimestamp > (Date.now() - 5000)) {
                deletedBy = deletionLog.executor.tag;
            }

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🗑️ Message Deleted')
                .setDescription(message.content || '*No content (embed/attachment only)*')
                .addFields(
                    {
                        name: 'Author',
                        value: message.author ? `${message.author.tag} (\`${message.author.id}\`)` : 'Unknown',
                        inline: true
                    },
                    {
                        name: 'Channel',
                        value: `${message.channel}`,
                        inline: true
                    },
                    {
                        name: 'Deleted By',
                        value: deletedBy,
                        inline: true
                    }
                )
                .setTimestamp();

            if (message.attachments.size > 0) {
                embed.addFields({
                    name: 'Attachments',
                    value: message.attachments.map(a => a.url).join('\n').substring(0, 1024),
                    inline: false
                });
            }

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Message delete log error:', error);
        }
    }
}