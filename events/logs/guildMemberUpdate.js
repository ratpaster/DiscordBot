const { EmbedBuilder } = require('discord.js');
const { serverLogChannelId } = require('../../config/logs.json');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        try {
            const logChannel = await newMember.guild.channels.fetch(serverLogChannelId).catch(() => null);
            if (!logChannel) return;

            if (oldMember.nickname !== newMember.nickname) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('✏️ Nickname Changed')
                    .addFields(
                        {
                            name: 'User',
                            value: `${newMember.user.tag} (\`${newMember.user.id}\`)`,
                            inline: false
                        },
                        {
                            name: 'Old Nickname',
                            value: oldMember.nickname || newMember.user.username,
                            inline: true
                        },
                        {
                            name: 'New Nickname',
                            value: newMember.nickname || newMember.user.username,
                            inline: true
                        }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

            if (addedRoles.size > 0) {
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('➕ Role Added')
                    .addFields(
                        {
                            name: 'User',
                            value: `${newMember.user.tag} (\`${newMember.user.id}\`)`,
                            inline: true
                        },
                        {
                            name: 'Role',
                            value: addedRoles.map(r => r.toString()).join(', '),
                            inline: true
                        }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            if (removedRoles.size > 0) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('➖ Role Removed')
                    .addFields(
                        {
                            name: 'User',
                            value: `${newMember.user.tag} (\`${newMember.user.id}\`)`,
                            inline: true
                        },
                        {
                            name: 'Role',
                            value: removedRoles.map(r => r.name).join(', '),
                            inline: true
                        }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Member update log error:', error);
        }
    }
}