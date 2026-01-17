const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logModAction } = require('../../utils/modLog');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription('Unban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addStringOption(option => option
        .setName('userid')
        .setDescription('ID of the user you wish to unban')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for unbanning the user')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(255)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { guild, options, user } = interaction;

        const userId = options.getString('userid');
        const reason = options.getString('reason') || 'No reason provided';

        if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.editReply({ content: '❌ I don\'t have permission to unban members.' });
        }

        if (!isValidSnowflake(userId)) {
            return interaction.editReply({ content: '❌ Invalid user ID provided. User IDs are 17-19 digit numbers.' });
        }

        try {
            const ban = await guild.bans.fetch(userId);
            const bannedUser = ban.user;

            await guild.members.unban(userId, reason);

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setAuthor({ name: bannedUser.tag, iconURL: bannedUser.displayAvatarURL() })
                .setTitle(`✅ ${bannedUser.tag} was unbanned`)
                .setDescription(`Issued by ${user.tag}`)
                .addFields(
                    {
                        name: 'User ID',
                        value: `\`${userId}\``,
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


            await logModAction(guild, 'unban', {
                target: { user: user, id: userId },
                moderator: interaction.user,
                reason: reason
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            if (err.code === 10026) {
                return interaction.editReply({ content: '❌ This user is not banned.' });
            }

            if (err.code === 10013) {
                return interaction.editReply({ content: '❌ Unknown user. Make sure the ID is correct.' });
            }

            console.error('Unban command error:', err);
            return interaction.editReply({ 
                content: `❌ Failed to unban user: ${err.message}` 
            });
        }
    }
}

function isValidSnowflake(snowflake) {
    const snowflakeRegex = /^[0-9]{17,19}$/;
    return snowflakeRegex.test(snowflake);
}