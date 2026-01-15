const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
const Member = require('../../models/member');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("clearinfractions")
    .setDescription('Clear all infractions for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addUserOption(option => option
        .setName('user')
        .setDescription('User to clear infractions for')
        .setRequired(true)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { user, guild, options } = interaction;

        const target = options.getUser('user');

        if (!target) {
            return interaction.editReply({ content: '❌ Invalid user.' });
        }

        try {
            const member = await Member.findOne({ 
                where: { id: target.id, guildId: guild.id }
            });

            if (!member) {
                return interaction.editReply({ 
                    content: `❌ ${target.tag} has no infractions to clear.` 
                });
            }

            const deletedCount = await Infraction.destroy({
                where: {
                    memberId: target.id,
                    guildId: guild.id
                }
            });

            if (deletedCount === 0) {
                return interaction.editReply({ 
                    content: `❌ ${target.tag} has no infractions to clear.` 
                });
            }

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                .setTitle('🗑️ Infractions Cleared')
                .setDescription(`All infractions for ${target.tag} have been cleared.`)
                .addFields(
                    {
                        name: 'Infractions Removed',
                        value: `\`${deletedCount}\``,
                        inline: true
                    },
                    {
                        name: 'Cleared By',
                        value: `${user.tag}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: guild.name, iconURL: guild.iconURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Clear infractions command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to clear infractions: ${error.message}` 
            });
        }
    }
}