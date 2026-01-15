const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
const Member = require('../../models/member');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription('Kick a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption(option => option
        .setName('member')
        .setDescription('User you wish to kick')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for kicking the user')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(255)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { user, guild, options } = interaction;

        const target = options.getMember('member');
        const reason = options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.editReply({ content: '❌ User is not in this server or is invalid.' });
        }

        if (user.id === target.id) {
            return interaction.editReply({ content: `❌ You can't kick yourself.` });
        }

        if (target.id === guild.ownerId) {
            return interaction.editReply({ content: `❌ You can't kick the server owner.` });
        }

        if (target.id === interaction.client.user.id) {
            return interaction.editReply({ content: `❌ I can't kick myself.` });
        }

        if (!target.kickable) {
            return interaction.editReply({ content: `❌ I don't have permission to kick this user. Their role might be higher than mine.` });
        }

        try {
            const [member] = await Member.findOrCreate({ where: { id: target.id, guildId: guild.id } });

            await target.kick(reason);

            const infraction = await member.createInfraction({
                guildId: guild.id,
                reason: reason,
                type: 'Kick',
                enforcerId: user.id
            });

            const totalInfractions = await Infraction.count({
                where: {
                    memberId: target.id,
                    guildId: guild.id
                }
            });

            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setAuthor({ name: target.user.tag, iconURL: target.displayAvatarURL() })
                .setTitle(`👢 ${target.user.tag} was kicked`)
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

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Kick command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to kick user: ${error.message}` 
            });
        }
    }
}