const { EmbedBuilder } = require('discord.js');
const { modLogChannelId } = require('../config/logs.json');

async function logModAction(guild, action, data) {
    try {
        const logChannel = await guild.channels.fetch(modLogChannelId).catch(() => null);
        if (!logChannel) return;

        const colors = {
            'warn': 'Yellow',
            'mute': 'Orange',
            'unmute': 'Green',
            'kick': 'Orange',
            'ban': 'Red',
            'unban': 'Green'
        };

        const emojis = {
            'warn': '⚠️',
            'mute': '🔇',
            'unmute': '🔊',
            'kick': '👢',
            'ban': '🔨',
            'unban': '🔓'
        };

        const embed = new EmbedBuilder()
            .setColor(colors[action] || 'Blue')
            .setTitle(`${emojis[action] || '📋'} ${action.charAt(0).toUpperCase() + action.slice(1)}`)
            .setThumbnail(data.target.displayAvatarURL())
            .addFields(
                {
                    name: 'User',
                    value: `${data.target.user.tag} (\`${data.target.user.id || data.target.id}\`)`,
                    inline: true
                },
                {
                    name: 'Moderator',
                    value: `${data.moderator.tag}`,
                    inline: true
                }
            )
            .setTimestamp();

        if (data.reason) {
            embed.addFields({
                name: 'Reason',
                value: `\`${data.reason}\``,
                inline: false
            });
        }

        if (data.duration) {
            embed.addFields({
                name: 'Duration',
                value: `\`${data.duration}\``,
                inline: true
            });
        }

        if (data.infractionId) {
            embed.addFields({
                name: 'Infraction ID',
                value: `\`${data.infractionId}\``,
                inline: true
            });
        }

        if (data.totalInfractions) {
            embed.addFields({
                name: 'Total Infractions',
                value: `\`${data.totalInfractions}\``,
                inline: true
            });
        }

        await logChannel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Mod log error:', error);
    }
}

module.exports = { logModAction };