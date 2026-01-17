const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { serverLogChannelId } = require('../../config/logs.json');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        try {
            const logChannel = await member.guild.channels.fetch(serverLogChannelId).catch(() => null);
            if (!logChannel) return;

            let reason = 'Left';
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberKick,
            });
            const kickLog = fetchedLogs.entries.first();

            if (kickLog && kickLog.target.id === member.user.id &&
                kickLog.createdTimestamp > (Date.now() - 5000)) {
                reason = `Kicked by ${kickLog.executor.tag}`;
            }

            const roles = member.roles.cache
                .filter(role => role.id !== member.guild.id)
                .map(role => role.name)
                .join(', ') || 'None';

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('📤 Member Left')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    {
                        name: 'User',
                        value: `${member.user.tag} (\`${member.user.id}\`)`,
                        inline: true
                    },
                    {
                        name: 'Reason',
                        value: reason,
                        inline: true
                    },
                    {
                        name: 'Joined Server',
                        value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown',
                        inline: true
                    },
                    {
                        name: 'Roles',
                        value: roles.substring(0, 1024),
                        inline: false
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
            console.error('Member remove log error:', error);
        }
    }
}