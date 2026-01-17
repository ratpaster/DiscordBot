const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
const Member = require('../../models/member');
const { logModAction } = require('../../utils/modLog');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption(option => option
        .setName('user')
        .setDescription('User you wish to warn')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for warning the user')
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

        if (user.id === target.id) {
            return interaction.editReply({ content: `❌ You can't warn yourself.` });
        }

        if (target.user.bot) {
            return interaction.editReply({ content: `❌ You can't warn bots.` });
        }

        try {
            const [member] = await Member.findOrCreate({ where: { id: target.id, guildId: guild.id } });

            const infraction = await member.createInfraction({
                guildId: guild.id,
                reason: reason,
                type: 'Warn',
                enforcerId: user.id
            });

            const totalInfractions = await Infraction.count({
                where: {
                    memberId: target.id,
                    guildId: guild.id
                }
            });

            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setAuthor({ name: target.user.tag, iconURL: target.displayAvatarURL() })
                .setTitle(`⚠️ ${target.user.tag} was warned`)
                .setDescription(`Issued by ${user.tag}`)
                .addFields(
                    {
                        name: 'Infraction ID',
                        value: `\`${infraction.id}\``,
                        inline: true,
                    },
                    {
                        name: 'Type',
                        value: `\`${infraction.type}\``,
                        inline: true,
                    },
                    {
                        name: 'Total Infractions',
                        value: `\`${totalInfractions}\``,
                        inline: true,
                    },
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

            await logModAction(guild, 'warn', {
                target: target,
                moderator: user,
                reason: reason,
                infractionId: infraction.id,
                totalInfractions: totalInfractions
            });
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Warn command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to warn user: ${error.message}` 
            });
        }
    }
}