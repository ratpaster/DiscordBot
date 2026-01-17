const { EmbedBuilder } = require('discord.js');
const { serverLogChannelId } = require('../../config/logs.json');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        try {
            const logChannel = await newState.guild.channels.fetch(serverLogChannelId).catch(() => null);
            if (!logChannel) return;

            if (!oldState.channel && newState.channel) {
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('🔊 Voice Channel Joined')
                    .addFields(
                        {
                            name: 'User',
                            value: `${newState.member.user.tag}`,
                            inline: true
                        },
                        {
                            name: 'Channel',
                            value: `${newState.channel}`,
                            inline: true
                        }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            if (oldState.channel && !newState.channel) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('🔇 Voice Channel Left')
                    .addFields(
                        {
                            name: 'User',
                            value: `${newState.member.user.tag}`,
                            inline: true
                        },
                        {
                            name: 'Channel',
                            value: `${oldState.channel.name}`,
                            inline: true
                        }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('🔀 Voice Channel Switched')
                    .addFields(
                        {
                            name: 'User',
                            value: `${newState.member.user.tag}`,
                            inline: false
                        },
                        {
                            name: 'From',
                            value: `${oldState.channel}`,
                            inline: true
                        },
                        {
                            name: 'To',
                            value: `${newState.channel}`,
                            inline: true
                        }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Voice state update log error:', error);
        }
    }
}