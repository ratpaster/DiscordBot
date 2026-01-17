const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { modLogChannelId } = require('../../config/logs.json');

module.exports = {
    name: 'guildBanAdd',
    async execute(ban) {
        try {
            const logChannel = await ban.guild.channels.fetch(modLogChannelId).catch(() => null);
            if (!logChannel) return;

            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanAdd,
            });
            const banLog = fetchedLogs.entries.first();

            let executor = 'Unknown';
            let reason = ban.reason || 'No reason provided';

            if (banLog && banLog.target.id === ban.user.id &&
                banLog.createdTimestamp > (Date.now() - 5000)) {
                executor = banLog.executor.tag;
                if (banLog.reason) reason = banLog.reason;
            }

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('🔨 Member Banned')
                .setThumbnail(ban.user.displayAvatarURL())
                .addFields(
                    {
                        name: 'User',
                        value: `${ban.user.tag} (\`${ban.user.id}\`)`,
                        inline: true
                    },
                    {
                        name: 'Banned By',
                        value: executor,
                        inline: true
                    },
                    {
                        name: 'Reason',
                        value: reason,
                        inline: false
                    }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Ban add log error:', error);
        }
    }
}