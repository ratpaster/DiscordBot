const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("case")
    .setDescription('View details of a specific infraction')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addIntegerOption(option => option
        .setName('id')
        .setDescription('Infraction ID to view')
        .setRequired(true)
        .setMinValue(1)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { guild, options } = interaction;

        const caseId = options.getInteger('id');

        try {
            const infraction = await Infraction.findOne({
                where: {
                    id: caseId,
                    guildId: guild.id
                }
            });

            if (!infraction) {
                return interaction.editReply({ 
                    content: `❌ Case #${caseId} not found.` 
                });
            }

            const targetUser = await interaction.client.users.fetch(infraction.memberId).catch(() => null);
            const enforcerUser = await interaction.client.users.fetch(infraction.enforcerId).catch(() => null);

            const timestamp = Math.floor(new Date(infraction.createdAt).getTime() / 1000);

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`📋 Case #${infraction.id}`)
                .addFields(
                    {
                        name: 'Type',
                        value: `\`${infraction.type}\``,
                        inline: true
                    },
                    {
                        name: 'User',
                        value: targetUser ? `${targetUser.tag}\n\`${targetUser.id}\`` : `\`${infraction.memberId}\``,
                        inline: true
                    },
                    {
                        name: 'Moderator',
                        value: enforcerUser ? `${enforcerUser.tag}\n\`${enforcerUser.id}\`` : `\`${infraction.enforcerId}\``,
                        inline: true
                    },
                    {
                        name: 'Reason',
                        value: `\`${infraction.reason}\``,
                        inline: false
                    },
                    {
                        name: 'Date',
                        value: `<t:${timestamp}:F> (<t:${timestamp}:R>)`,
                        inline: false
                    }
                )
                .setTimestamp(new Date(infraction.createdAt))
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });

            if (infraction.duration && infraction.duration > 0) {
                const durationSeconds = Math.floor(infraction.duration / 1000);
                const days = Math.floor(durationSeconds / 86400);
                const hours = Math.floor((durationSeconds % 86400) / 3600);
                const minutes = Math.floor((durationSeconds % 3600) / 60);

                let durationStr = '';
                if (days > 0) durationStr += `${days}d `;
                if (hours > 0) durationStr += `${hours}h `;
                if (minutes > 0) durationStr += `${minutes}m`;

                embed.addFields({
                    name: 'Duration',
                    value: `\`${durationStr.trim()}\``,
                    inline: true
                });
            }

            if (targetUser) {
                embed.setThumbnail(targetUser.displayAvatarURL());
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Case command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to fetch case: ${error.message}` 
            });
        }
    }
}