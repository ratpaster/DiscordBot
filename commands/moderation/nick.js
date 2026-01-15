const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription('Change or reset a user\'s nickname')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .setDMPermission(false)
    .addUserOption(option => option
        .setName('user')
        .setDescription('User to change nickname for')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('nickname')
        .setDescription('New nickname (leave empty to reset)')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(32)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { user, guild, options } = interaction;

        const target = options.getMember('user');
        const newNickname = options.getString('nickname');

        if (!target) {
            return interaction.editReply({ content: '❌ User is not in this server or is invalid.' });
        }

        if (target.id === guild.ownerId) {
            return interaction.editReply({ content: `❌ You can't change the server owner's nickname.` });
        }

        if (!target.manageable) {
            return interaction.editReply({ content: `❌ I don't have permission to change this user's nickname. Their role might be higher than mine.` });
        }

        try {
            const oldNickname = target.nickname || target.user.username;
            
            await target.setNickname(newNickname);

            const action = newNickname ? 'changed' : 'reset';
            const displayNickname = newNickname || target.user.username;

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setAuthor({ name: target.user.tag, iconURL: target.displayAvatarURL() })
                .setTitle(`✏️ Nickname ${action}`)
                .setDescription(`${target}'s nickname was ${action} by ${user.tag}`)
                .addFields(
                    {
                        name: 'Old Nickname',
                        value: `\`${oldNickname}\``,
                        inline: true
                    },
                    {
                        name: 'New Nickname',
                        value: `\`${displayNickname}\``,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Nick command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to change nickname: ${error.message}` 
            });
        }
    }
}