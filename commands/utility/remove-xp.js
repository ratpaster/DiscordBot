const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ownerID } = require('../../config/config.json');
const Level = require('../../models/level');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("remove-xp")
    .setDescription('Remove XP from a user (Owner only)')
    .addUserOption(option => option
        .setName('user')
        .setDescription('User to remove XP from')
        .setRequired(true)
    )
    .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Amount of XP to remove')
        .setRequired(true)
        .setMinValue(1)
    ),

    async execute(interaction) {
        if (interaction.user.id !== ownerID) {
            return interaction.reply({ content: '❌ Owner only command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: false });
        const { guild, options } = interaction;

        const target = options.getUser('user');
        const amount = options.getInteger('amount');

        try {
            const userLevel = await Level.findOne({
                where: { userId: target.id, guildId: guild.id }
            });

            if (!userLevel) {
                return interaction.editReply({ 
                    content: `❌ ${target.tag} has no XP data.` 
                });
            }

            const oldXP = userLevel.xp;
            const oldLevel = userLevel.level;

            userLevel.xp = Math.max(0, userLevel.xp - amount);
            userLevel.level = Math.floor(userLevel.xp / 100);
            await userLevel.save();

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('💸 XP Removed')
                .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                .addFields(
                    {
                        name: 'Amount Removed',
                        value: `-${amount} XP`,
                        inline: true
                    },
                    {
                        name: 'Old Balance',
                        value: `${oldXP} XP (Level ${oldLevel})`,
                        inline: true
                    },
                    {
                        name: 'New Balance',
                        value: `${userLevel.xp} XP (Level ${userLevel.level})`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Removed by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Remove XP command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to remove XP: ${error.message}` 
            });
        }
    }
}