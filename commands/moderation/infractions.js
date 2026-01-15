const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
const Member = require('../../models/member');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("infractions")
    .setDescription('View a user\'s infraction history')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption(option => option
        .setName('user')
        .setDescription('User to view infractions for')
        .setRequired(true)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { guild, options } = interaction;

        const target = options.getUser('user');

        if (!target) {
            return interaction.editReply({ content: '❌ Invalid user.' });
        }

        try {
            const member = await Member.findOne({ 
                where: { id: target.id, guildId: guild.id },
                include: [{
                    model: Infraction,
                    order: [['createdAt', 'DESC']]
                }]
            });

            if (!member || !member.infractions || member.infractions.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                    .setTitle('📋 Infraction History')
                    .setDescription(`${target.tag} has no infractions.`)
                    .setTimestamp()
                    .setFooter({ text: guild.name, iconURL: guild.iconURL() });

                return interaction.editReply({ embeds: [embed] });
            }

            const infractions = member.infractions;
            const totalInfractions = infractions.length;

            const infractionList = infractions.slice(0, 10).map(inf => {
                const date = new Date(inf.createdAt);
                const timestamp = Math.floor(date.getTime() / 1000);
                return `**ID ${inf.id}** • \`${inf.type}\` • <t:${timestamp}:R>\n└ ${inf.reason}`;
            }).join('\n\n');

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                .setTitle('📋 Infraction History')
                .setDescription(infractionList)
                .addFields({
                    name: 'Total Infractions',
                    value: `\`${totalInfractions}\``,
                    inline: true
                })
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });

            if (totalInfractions > 10) {
                embed.setFooter({ 
                    text: `${guild.name} • Showing 10 of ${totalInfractions} infractions`, 
                    iconURL: guild.iconURL() 
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Infractions command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to fetch infractions: ${error.message}` 
            });
        }
    }
}