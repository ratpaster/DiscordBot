const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("help")
    .setDescription('View all available commands')
    .addStringOption(option => option
        .setName('command')
        .setDescription('Get detailed help for a specific command')
        .setRequired(false)
        .setAutocomplete(true)
    ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const commands = interaction.client.commands;
        
        const choices = Array.from(commands.values())
            .map(cmd => ({ name: cmd.data.name, value: cmd.data.name }))
            .filter(choice => choice.name.startsWith(focusedValue))
            .slice(0, 25);

        await interaction.respond(choices);
    },

    async execute(interaction) {
        const specificCommand = interaction.options.getString('command');
        const { member, client } = interaction;

        const isModerator = member.permissions.has(PermissionFlagsBits.ModerateMembers);
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

        const commands = Array.from(client.commands.values());

        const categories = {
            moderation: [],
            fun: [],
            utility: [],
            setup: [],
            testing: []
        };

        for (const cmd of commands) {
            const cmdPath = cmd.data.name;
            let category = 'utility';

            if (cmd.data.default_member_permissions) {
                const perms = new PermissionsBitField(cmd.data.default_member_permissions);
                
                if (perms.has(PermissionFlagsBits.BanMembers) || 
                    perms.has(PermissionFlagsBits.KickMembers) ||
                    perms.has(PermissionFlagsBits.ModerateMembers) ||
                    perms.has(PermissionFlagsBits.ManageMessages) ||
                    perms.has(PermissionFlagsBits.ManageChannels)) {
                    category = 'moderation';
                    if (!isModerator && !isAdmin) continue;
                } else if (perms.has(PermissionFlagsBits.Administrator)) {
                    category = 'setup';
                    if (!isAdmin) continue;
                }
            }

            const commandFile = client.commandFiles?.get(cmd.data.name);
            if (commandFile) {
                if (commandFile.includes('/fun/')) category = 'fun';
                else if (commandFile.includes('/utility/')) category = 'utility';
                else if (commandFile.includes('/moderation/')) category = 'moderation';
                else if (commandFile.includes('/setup/')) category = 'setup';
                else if (commandFile.includes('/testing/')) category = 'testing';
            }

            categories[category].push(cmd);
        }

        if (specificCommand) {
            const command = commands.find(cmd => cmd.data.name === specificCommand);
            
            if (!command) {
                return interaction.reply({ 
                    content: `❌ Command \`${specificCommand}\` not found.`, 
                    ephemeral: true 
                });
            }

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`📖 Command: /${command.data.name}`)
                .setDescription(command.data.description || 'No description available')
                .setTimestamp();

            if (command.data.options && command.data.options.length > 0) {
                let optionsText = '';
                for (const option of command.data.options) {
                    const required = option.required ? '`[Required]`' : '`[Optional]`';
                    optionsText += `**${option.name}** ${required}\n└ ${option.description}\n\n`;
                }
                embed.addFields({
                    name: 'Options',
                    value: optionsText,
                    inline: false
                });
            }

            if (command.data.default_member_permissions) {
                const perms = new PermissionsBitField(command.data.default_member_permissions);
                const permsList = [];
                
                if (perms.has(PermissionFlagsBits.Administrator)) permsList.push('Administrator');
                if (perms.has(PermissionFlagsBits.BanMembers)) permsList.push('Ban Members');
                if (perms.has(PermissionFlagsBits.KickMembers)) permsList.push('Kick Members');
                if (perms.has(PermissionFlagsBits.ModerateMembers)) permsList.push('Moderate Members');
                if (perms.has(PermissionFlagsBits.ManageMessages)) permsList.push('Manage Messages');
                if (perms.has(PermissionFlagsBits.ManageChannels)) permsList.push('Manage Channels');
                
                if (permsList.length > 0) {
                    embed.addFields({
                        name: '🔒 Required Permissions',
                        value: permsList.join(', '),
                        inline: false
                    });
                }
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const categoryEmojis = {
            moderation: '🛡️',
            fun: '🎮',
            utility: '🔧',
            setup: '⚙️',
            testing: '🧪'
        };

        const categoryNames = {
            moderation: 'Moderation',
            fun: 'Fun',
            utility: 'Utility',
            setup: 'Setup',
            testing: 'Testing'
        };

        const mainEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('📚 Command Help')
            .setDescription('Select a category below to view commands, or use `/help <command>` for detailed info.')
            .setTimestamp()
            .setFooter({ text: `${commands.length} commands available` });

        for (const [category, cmds] of Object.entries(categories)) {
            if (cmds.length > 0) {
                mainEmbed.addFields({
                    name: `${categoryEmojis[category]} ${categoryNames[category]} (${cmds.length})`,
                    value: cmds.map(cmd => `\`/${cmd.data.name}\``).join(', '),
                    inline: false
                });
            }
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help-category')
            .setPlaceholder('📂 Select a category for details')
            .addOptions(
                Object.entries(categories)
                    .filter(([_, cmds]) => cmds.length > 0)
                    .map(([category, cmds]) => 
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`${categoryNames[category]} (${cmds.length})`)
                            .setDescription(`View ${categoryNames[category].toLowerCase()} commands`)
                            .setValue(category)
                            .setEmoji(categoryEmojis[category])
                    )
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({ 
            embeds: [mainEmbed], 
            components: [row],
            ephemeral: true 
        });

        const collector = response.createMessageComponentCollector({ 
            time: 300000
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ 
                    content: '❌ This menu is not for you.', 
                    ephemeral: true 
                });
            }

            const category = i.values[0];
            const cmds = categories[category];

            const categoryEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`${categoryEmojis[category]} ${categoryNames[category]} Commands`)
                .setDescription(`Use \`/help <command>\` for detailed information about a specific command.`)
                .setTimestamp();

            let description = '';
            for (const cmd of cmds) {
                description += `**/${cmd.data.name}**\n└ ${cmd.data.description}\n\n`;
            }

            categoryEmbed.addFields({
                name: `Commands (${cmds.length})`,
                value: description || 'No commands in this category',
                inline: false
            });

            await i.update({ embeds: [categoryEmbed], components: [row] });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
}