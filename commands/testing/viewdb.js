const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ownerID } = require('../../config/config.json');
const Level = require('../../models/level');
const Member = require('../../models/member');
const Infraction = require('../../models/infraction');
const Guild = require('../../models/guild');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("database")
    .setDescription('View database contents (owner only)')
    .addStringOption(option => option
        .setName('table')
        .setDescription('Which table to view')
        .addChoices(
            { name: 'Levels', value: 'levels' },
            { name: 'Infractions', value: 'infractions' },
            { name: 'Members', value: 'members' },
            { name: 'Guilds', value: 'guilds' }
        )
        .setRequired(true)
    ),

    async execute(interaction) {
        if (interaction.user.id !== ownerID) {
            return interaction.reply({ content: '❌ Owner only command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const table = interaction.options.getString('table');
        let data = [];

        try {
            switch(table) {
                case 'levels':
                    data = await Level.findAll({ 
                        where: { guildId: interaction.guild.id },
                        order: [['xp', 'DESC']] 
                    });
                    break;
                case 'infractions':
                    data = await Infraction.findAll({ 
                        where: { guildId: interaction.guild.id },
                        order: [['createdAt', 'DESC']] 
                    });
                    break;
                case 'members':
                    data = await Member.findAll({ 
                        where: { guildId: interaction.guild.id } 
                    });
                    break;
                case 'guilds':
                    data = await Guild.findAll();
                    break;
            }

            if (data.length === 0) {
                return interaction.editReply({ content: `❌ No entries found in ${table} table.` });
            }

            const itemsPerPage = 5;
            const totalPages = Math.ceil(data.length / itemsPerPage);
            let currentPage = 0;

            const generateEmbed = async (page) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const pageData = data.slice(start, end);

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle(`🗃️ Database: ${table.charAt(0).toUpperCase() + table.slice(1)}`)
                    .setFooter({ text: `Page ${page + 1} of ${totalPages} • Total entries: ${data.length}` })
                    .setTimestamp();

                let description = '';

                for (let i = 0; i < pageData.length; i++) {
                    const entry = pageData[i];
                    const globalIndex = start + i + 1;

                    switch(table) {
                        case 'levels':
                            const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
                            description += `**#${globalIndex}** ${user ? user.tag : 'Unknown User'}\n`;
                            description += `└ Level: \`${entry.level}\` • XP: \`${entry.xp}\` • Messages: \`${entry.messageCount}\`\n`;
                            description += `└ User ID: \`${entry.userId}\`\n\n`;
                            break;

                        case 'infractions':
                            const targetUser = await interaction.client.users.fetch(entry.memberId).catch(() => null);
                            const enforcer = await interaction.client.users.fetch(entry.enforcerId).catch(() => null);
                            const date = new Date(entry.createdAt);
                            const timestamp = Math.floor(date.getTime() / 1000);
                            
                            description += `**Case #${entry.id}** • \`${entry.type}\`\n`;
                            description += `└ User: ${targetUser ? targetUser.tag : 'Unknown'} (\`${entry.memberId}\`)\n`;
                            description += `└ Moderator: ${enforcer ? enforcer.tag : 'Unknown'} (\`${entry.enforcerId}\`)\n`;
                            description += `└ Reason: \`${entry.reason}\`\n`;
                            description += `└ Date: <t:${timestamp}:F>\n\n`;
                            break;

                        case 'members':
                            const member = await interaction.client.users.fetch(entry.id).catch(() => null);
                            description += `**#${globalIndex}** ${member ? member.tag : 'Unknown User'}\n`;
                            description += `└ User ID: \`${entry.id}\`\n`;
                            description += `└ Guild ID: \`${entry.guildId}\`\n\n`;
                            break;

                        case 'guilds':
                            const guildObj = await interaction.client.guilds.fetch(entry.id).catch(() => null);
                            description += `**#${globalIndex}** ${guildObj ? guildObj.name : 'Unknown Guild'}\n`;
                            description += `└ Guild ID: \`${entry.id}\`\n`;
                            description += `└ Welcome Channel: ${entry.welcomeChannelId ? `\`${entry.welcomeChannelId}\`` : 'Not set'}\n`;
                            description += `└ Welcome Role: ${entry.welcomeChannelRole ? `\`${entry.welcomeChannelRole}\`` : 'Not set'}\n\n`;
                            break;
                    }
                }

                embed.setDescription(description || 'No data');
                return embed;
            };

            const getButtons = (page) => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('⏮️ First')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀️ Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next ▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('Last ⏭️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === totalPages - 1)
                    );
            };

            const embed = await generateEmbed(currentPage);
            const message = await interaction.editReply({ 
                embeds: [embed], 
                components: [getButtons(currentPage)]
            });

            const collector = message.createMessageComponentCollector({ 
                time: 300000
            });

            collector.on('collect', async i => {
                if (i.user.id !== ownerID) {
                    return i.reply({ content: '❌ Only the command user can use these buttons.', ephemeral: true });
                }

                switch(i.customId) {
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'prev':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(totalPages - 1, currentPage + 1);
                        break;
                    case 'last':
                        currentPage = totalPages - 1;
                        break;
                }

                const newEmbed = await generateEmbed(currentPage);
                await i.update({ 
                    embeds: [newEmbed], 
                    components: [getButtons(currentPage)]
                });
            });

            collector.on('end', () => {
                message.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('Database command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to fetch database: ${error.message}` 
            });
        }
    }
}