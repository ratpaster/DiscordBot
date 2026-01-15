const Level = require('../models/level');

const XP_PER_MESSAGE = 1;
const XP_PER_LEVEL = 100;
const COOLDOWN = 60000;

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        try {
            const [userLevel, created] = await Level.findOrCreate({
                where: {
                    userId: message.author.id,
                    guildId: message.guild.id
                },
                defaults: {
                    xp: 0,
                    level: 0,
                    messageCount: 0,
                    lastMessageTimestamp: 0
                }
            });

            const now = Date.now();
            
            if (now - userLevel.lastMessageTimestamp < COOLDOWN) {
                return;
            }

            userLevel.messageCount += 1;
            userLevel.xp += XP_PER_MESSAGE;
            userLevel.lastMessageTimestamp = now;

            const newLevel = Math.floor(userLevel.xp / XP_PER_LEVEL);

            if (newLevel > userLevel.level) {
                userLevel.level = newLevel;
                await userLevel.save();

                const levelUpMessage = `🎉 ${message.author}, you leveled up to **Level ${newLevel}**!`;
                message.channel.send(levelUpMessage).catch(console.error);
            } else {
                await userLevel.save();
            }

        } catch (error) {
            console.error('Error in level system:', error);
        }
    }
};