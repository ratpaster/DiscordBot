const { Client, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("whois")
    .setDescription('Information about the mentioned user.')
    .addUserOption(option => option
        .setName('member')
        .setDescription('User you want info about.')
        .setRequired(false)
    ),

    async execute(interaction) {

        const { user, options, guild } = interaction;
        const target = await options.getMember('member') || interaction.member;

        const roles = target.roles.cache
            .filter(role => role.id !== guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, 15);

        const joinPosition = [...guild.members.cache.values()]
            .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
            .findIndex(member => member.id === target.id) + 1;

        const e = new EmbedBuilder()
            .setTitle(`User Information`)
            .setDescription(`Details for ${target.user.tag}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
            .setImage(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setTimestamp()
            .setColor(target.displayHexColor || 'Random')
            .addFields(
                {
                    name: '👤 Username',
                    value: target.user.tag,
                    inline: true
                },
                {
                    name: '🆔 User ID',
                    value: target.id,
                    inline: true
                },
                {
                    name: '🤖 Bot',
                    value: target.user.bot ? 'Yes' : 'No',
                    inline: true
                },
                {
                    name: '📅 Account Created',
                    value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:F>`,
                    inline: false
                },
                {
                    name: '📥 Joined Server',
                    value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:F>`,
                    inline: false
                },
                {
                    name: '📊 Join Position',
                    value: `#${joinPosition}`,
                    inline: true
                },
                {
                    name: `🎭 Roles [${roles.length}]`,
                    value: roles.length ? roles.join(', ') : 'None',
                    inline: false
                },
                {
                    name: '🔝 Highest Role',
                    value: target.roles.highest.toString(),
                    inline: true
                },
                {
                    name: '🎨 Role Color',
                    value: target.displayHexColor || 'None',
                    inline: true
                }
            );

        await interaction.reply({
            embeds: [e],
        });
    }
}