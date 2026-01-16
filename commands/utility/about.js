const { Client, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("about")
    .setDescription('~About Moribund~'),

    async execute(interaction) {
        const e = new EmbedBuilder()
            .setTitle(`Welcome ${interaction.user.username}`)
            .setDescription(`General information regarding the discord server, discord bot, and minecraft server can be found here. for more detailed information use the /help command or ask Moribund with the /ask command`)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp()
            .setColor(`Random`)
            .addFields(
                {
                    name:'Discord',
                    value: 'About Moribund',
                    inline: false
                },{
                    name: 'Bot',
                    value: 'About Moribund',
                    inline: false
                },{
                    name: 'Minecraft',
                    value: 'About server + links and mod info',
                    inline: false
                }
            );

        await interaction.reply({
            embeds: [e],
            //ephemeral: true //hidden or not
        });
    }
}