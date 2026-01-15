const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ownerID } = require('../../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription('Replies with "Pong!"'),

    async execute(interaction, client, distube, genius) {
        await interaction.channel.send('\`Pinging ...\`').then (async (msg) => {
            msg.delete();
            const e = new EmbedBuilder()
                .setTitle(`\`${client.user.tag} | Requested by ${interaction.user.username}\``)
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp()
                .setColor(`Random`)
                .addFields(
                    {
                        name:'Bot Latency',
                        value: `\`${msg.createdTimestamp - interaction.createdTimestamp} ms\``,
                        inline: true
                    },{
                        name: 'API Latency',
                        value: `\`${Math.round(client.ws.ping)} ms\``,
                        inline: true
                    }
                );
            return interaction.channel.send({ embeds: [e] });
        })
    }
}