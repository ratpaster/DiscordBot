const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModAction } = require('../../utils/modLog');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription('Remove timeout from a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption(option => option
        .setName('user')
        .setDescription('User you wish to remove timeout from')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for removing timeout')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(255)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { user, guild, options } = interaction;

        const target = options.getMember('user');
        const reason = options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.editReply({ content: '❌ User is not in this server or is invalid.' });
        }

        if (!target.isCommunicationDisabled()) {
            return interaction.editReply({ content: `❌ ${target.user.tag} is not timed out.` });
        }

        if (!target.moderatable) {
            return interaction.editReply({ content: `❌ I don't have permission to remove timeout from this user.` });
        }

        try {
            await target.timeout(null, reason);

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setAuthor({ name: target.user.tag, iconURL: target.displayAvatarURL() })
                .setTitle(`🔊 ${target.user.tag}'s timeout was removed`)
                .setDescription(`Issued by ${user.tag}`)
                .addFields(
                    {
                        name: 'User ID',
                        value: `\`${target.id}\``,
                        inline: true,
                    },
                    {
                        name: 'Reason',
                        value: `\`${reason}\``,
                        inline: false,
                    }
                )
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });


            await logModAction(guild, 'unmute', {
                target: target,
                moderator: user,
                reason: reason
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Unmute command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to remove timeout: ${error.message}` 
            });
        }
    }
}