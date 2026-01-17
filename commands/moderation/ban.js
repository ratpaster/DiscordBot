const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
const Member = require('../../models/member');
const { logModAction } = require('../../utils/modLog');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription('Ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption(option => option
        .setName('member')
        .setDescription('User you wish to ban')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for banning the user')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(255)
    )
    .addIntegerOption(option => option
        .setName('delete-days')
        .setDescription('Delete messages from the last X days (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        
        const { user, guild, options, member: executor } = interaction;

        const target = options.getMember('member');
        const reason = options.getString('reason') || 'No reason provided';
        const deleteDays = options.getInteger('delete-days') || 0;

        if (!target) {
            return interaction.editReply({ content: '❌ User is not in this server or is invalid.' });
        }

        if (user.id === target.id) {
            return interaction.editReply({ content: `❌ You can't ban yourself.` });
        }

        if (target.id === guild.ownerId) {
            return interaction.editReply({ content: `❌ You can't ban the server owner.` });
        }

        if (target.id === interaction.client.user.id) {
            return interaction.editReply({ content: `❌ I can't ban myself.` });
        }

        if (!target.bannable) {
            return interaction.editReply({ content: `❌ I don't have permission to ban this user. Their role might be higher than mine.` });
        }

        try {
            const [member] = await Member.findOrCreate({ where: { id: target.id, guildId: guild.id } });

            await target.ban({ reason, deleteMessageSeconds: deleteDays * 86400 });

            const infraction = await member.createInfraction({
                guildId: guild.id,
                reason: reason,
                type: 'Ban',
                enforcerId: user.id
            });

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: target.user.tag, iconURL: target.displayAvatarURL() })
                .setTitle(`🔨 ${target.user.tag} was banned`)
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

            if (deleteDays > 0) {
                embed.addFields({
                    name: 'Messages Deleted',
                    value: `Last ${deleteDays} day${deleteDays > 1 ? 's' : ''}`,
                    inline: true
                });
            }

            await logModAction(guild, 'ban', {
                target: target,
                moderator: user,
                reason: reason,
                infractionId: infraction.id,
                totalInfractions: totalInfractions
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Ban command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to ban user: ${error.message}` 
            });
        }
    }
}