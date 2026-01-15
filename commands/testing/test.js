const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ownerID } = require('../../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("test")
    .setDescription('test command'),

    async execute(interaction) {
        const { member } = interaction;
        if(member.id !== ownerID) return interaction.reply(`You can't use this command.`);

        const e = new EmbedBuilder()
            .setTitle(`Welcome ${interaction.user.username}`)
            .setDescription(`UNDER DEVELOPMENT`)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp()
            .setColor(`Random`)
            .addFields(
                {
                    name:'FAQs',
                    value: 'example text',
                    inline: true
                },{
                    name: 'more stuff',
                    value: 'so much extra example text! \nnew line',
                    inline: false
                }
            );

        await interaction.reply({
            embeds: [e],
            //ephemeral: true //hidden or not
        });
    }
}