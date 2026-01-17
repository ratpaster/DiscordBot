const { EmbedBuilder } = require('discord.js');
const { serverLogChannelId } = require('../../config/logs.json');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage) {
        if (!newMessage.guild || newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;

        try {
            const logChannel = await newMessage.guild.channels.fetch(serverLogChannelId).catch(() => null);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('✏️ Message Edited')
                .addFields(
                    {
                        name: 'Author',
                        value: `${newMessage.author.tag} (\`${newMessage.author.id}\`)`,
                        inline: true
                    },
                    {
                        name: 'Channel',
                        value: `${newMessage.channel}`,
                        inline: true
                    },
                    {
                        name: 'Message Link',
                        value: `[Jump to Message](${newMessage.url})`,
                        inline: true
                    },
                    {
                        name: 'Before',
                        value: oldMessage.content?.substring(0, 1024) || '*No content*',
                        inline: false
                    },
                    {
                        name: 'After',
                        value: newMessage.content?.substring(0, 1024) || '*No content*',
                        inline: false
                    }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Message update log error:', error);
        }
    }
}