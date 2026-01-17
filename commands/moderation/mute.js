const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
const Member = require('../../models/member');
const { logModAction } = require('../../utils/modLog');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription('Timeout a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption(option => option
        .setName('user')
        .setDescription('User you wish to timeout')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('duration')
        .setDescription('Duration (e.g., 10m, 2h, 1d) - Max 28 days')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for timing out the user')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(255)
    ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const { user, guild, options } = interaction;

        const target = options.getMember('user');
        const durationStr = options.getString('duration');
        const reason = options.getString('reason') || 'No reason provided';

        if (!target) {
            return interaction.editReply({ content: '❌ User is not in this server or is invalid.' });
        }

        if (user.id === target.id) {
            return interaction.editReply({ content: `❌ You can't timeout yourself.` });
        }

        if (target.user.bot) {
            return interaction.editReply({ content: `❌ You can't timeout bots.` });
        }

        if (target.id === guild.ownerId) {
            return interaction.editReply({ content: `❌ You can't timeout the server owner.` });
        }

        if (!target.moderatable) {
            return interaction.editReply({ content: `❌ I don't have permission to timeout this user. Their role might be higher than mine.` });
        }

        const durationMs = parseDuration(durationStr);

        if (!durationMs) {
            return interaction.editReply({ content: '❌ Invalid duration format. Use formats like: `10m`, `2h`, `1d`' });
        }

        if (durationMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.editReply({ content: '❌ Duration cannot exceed 28 days (Discord limit).' });
        }

        if (durationMs < 1000) {
            return interaction.editReply({ content: '❌ Duration must be at least 1 second.' });
        }

        try {
            const [member] = await Member.findOrCreate({ where: { id: target.id, guildId: guild.id } });

            await target.timeout(durationMs, reason);

            const infraction = await member.createInfraction({
                guildId: guild.id,
                reason: reason,
                type: 'Mute',
                enforcerId: user.id,
                duration: durationMs
            });

            const totalInfractions = await Infraction.count({
                where: {
                    memberId: target.id,
                    guildId: guild.id
                }
            });

            const expiresAt = Math.floor((Date.now() + durationMs) / 1000);

            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setAuthor({ name: target.user.tag, iconURL: target.displayAvatarURL() })
                .setTitle(`🔇 ${target.user.tag} was timed out`)
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
                        name: 'Duration',
                        value: `\`${durationStr}\``,
                        inline: true,
                    },
                    {
                        name: 'Expires',
                        value: `<t:${expiresAt}:R>`,
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

            await logModAction(guild, 'mute', {
                target: target,
                moderator: user,
                reason: reason,
                duration: durationStr,
                infractionId: infraction.id,
                totalInfractions: totalInfractions
            });
            
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Mute command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to timeout user: ${error.message}` 
            });
        }
    }
}

function parseDuration(duration) {
    const regex = /^(\d+)([smhdw])$/i;
    const match = duration.match(regex);

    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    const units = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000
    };

    return value * units[unit];
}