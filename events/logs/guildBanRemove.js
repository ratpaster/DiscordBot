const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { modLogChannelId } = require('../../config/logs.json');

module.exports = {
    name: 'guildBanRemove',
    async execute(ban) {
        try {
            const logChannel = await ban.guild.channels.fetch(modLogChannelId).catch(() => null);
            if (!logChannel) return;

            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanRemove,
            });
            const unbanLog = fetchedLogs.entries.first();

            let executor = 'Unknown';

            if (unbanLog && unbanLog.target.id === ban.user.id &&
                unbanLog.createdTimestamp > (Date.now() - 5000)) {
                executor = unbanLog.executor.tag;
            }

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('🔓 Member Unbanned')
                .setThumbnail(ban.user.displayAvatarURL())
                .addFields(
                    {
                        name: 'User',
                        value: `${ban.user.tag} (\`${ban.user.id}\`)`,
                        inline: true
                    },
                    {
                        name: 'Unbanned By',
                        value: executor,
                        inline: true
                    }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Ban remove log error:', error);
        }
    }
}