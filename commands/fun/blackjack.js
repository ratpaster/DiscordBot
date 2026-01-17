const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Level = require('../../models/level');
const BlackjackGame = require('../../models/blackjackGame');
const BlackjackStats = require('../../models/blackjackStats');

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const values = { 'A': 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10 };

module.exports = {
    data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription('Play blackjack and bet your XP')
    .addIntegerOption(option => option
        .setName('bet')
        .setDescription('Amount of XP to bet')
        .setRequired(true)
        .setMinValue(10)
    ),

    async execute(interaction) {
        await interaction.deferReply();
        const { user, guild, options } = interaction;

        const betAmount = options.getInteger('bet');

        try {
            const existingGame = await BlackjackGame.findOne({
                where: { userId: user.id, guildId: guild.id, status: 'active' }
            });

            if (existingGame) {
                return interaction.editReply({ 
                    content: '❌ You already have an active blackjack game! Finish it first.' 
                });
            }

            let userLevel = await Level.findOne({
                where: { userId: user.id, guildId: guild.id }
            });

            if (!userLevel || userLevel.xp < betAmount) {
                return interaction.editReply({ 
                    content: `❌ You don't have enough XP! You have ${userLevel?.xp || 0} XP.` 
                });
            }

            const maxBet = Math.floor(userLevel.xp * 0.5);
            if (betAmount > maxBet) {
                return interaction.editReply({ 
                    content: `❌ Maximum bet is 50% of your XP (${maxBet} XP).` 
                });
            }

            const deck = createDeck();
            const playerHand = [drawCard(deck), drawCard(deck)];
            const dealerHand = [drawCard(deck), drawCard(deck)];

            const game = await BlackjackGame.create({
                userId: user.id,
                guildId: guild.id,
                betAmount: betAmount,
                playerHand: playerHand,
                dealerHand: dealerHand,
                deck: deck,
                status: 'active',
                canDoubleDown: true
            });

            userLevel.xp -= betAmount;
            await userLevel.save();

            const playerValue = calculateHand(playerHand);

            if (playerValue === 21) {
                return handleBlackjack(interaction, game, userLevel);
            }

            const embed = createGameEmbed(user, playerHand, dealerHand, betAmount, false);
            const buttons = createButtons(true);

            const message = await interaction.editReply({ embeds: [embed], components: [buttons] });
            game.messageId = message.id;
            await game.save();

            const collector = message.createMessageComponentCollector({ time: 120000 });

            collector.on('collect', async i => {
                if (i.user.id !== user.id) {
                    return i.reply({ content: '❌ This is not your game!', ephemeral: true });
                }

                const currentGame = await BlackjackGame.findOne({
                    where: { userId: user.id, guildId: guild.id, status: 'active' }
                });

                if (!currentGame) {
                    return i.update({ content: '❌ Game expired.', embeds: [], components: [] });
                }

                const currentUserLevel = await Level.findOne({
                    where: { userId: user.id, guildId: guild.id }
                });

                if (i.customId === 'bj_hit') {
                    await handleHit(i, currentGame, currentUserLevel);
                } else if (i.customId === 'bj_stand') {
                    await handleStand(i, currentGame, currentUserLevel);
                } else if (i.customId === 'bj_double') {
                    await handleDouble(i, currentGame, currentUserLevel);
                }
            });

            collector.on('end', async () => {
                const finalGame = await BlackjackGame.findOne({
                    where: { userId: user.id, guildId: guild.id, messageId: message.id }
                });
                
                if (finalGame && finalGame.status === 'active') {
                    finalGame.status = 'expired';
                    await finalGame.save();
                }
            });

        } catch (error) {
            console.error('Blackjack command error:', error);
            return interaction.editReply({ 
                content: `❌ Failed to start game: ${error.message}` 
            });
        }
    }
}

function createDeck() {
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit, value: values[rank] });
        }
    }
    return shuffle(deck);
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function drawCard(deck) {
    return deck.shift();
}

function calculateHand(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        if (card.rank === 'A') {
            aces++;
            value += 11;
        } else {
            value += card.value;
        }
    }

    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

function formatHand(hand, hideSecond = false) {
    if (hideSecond && hand.length > 1) {
        return `[${hand[0].rank}${hand[0].suit}] [?]`;
    }
    return hand.map(card => `[${card.rank}${card.suit}]`).join(' ');
}

function createGameEmbed(user, playerHand, dealerHand, betAmount, gameOver = false) {
    const playerValue = calculateHand(playerHand);
    const dealerValue = gameOver ? calculateHand(dealerHand) : calculateHand([dealerHand[0]]);

    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🃏 Blackjack')
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .addFields(
            {
                name: `Dealer's Hand ${gameOver ? `(${dealerValue})` : ''}`,
                value: formatHand(dealerHand, !gameOver),
                inline: false
            },
            {
                name: `Your Hand (${playerValue})`,
                value: formatHand(playerHand),
                inline: false
            },
            {
                name: 'Bet',
                value: `${betAmount} XP`,
                inline: true
            }
        )
        .setTimestamp();

    return embed;
}

function createButtons(canDoubleDown = true) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('bj_hit')
                .setLabel('Hit')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👊'),
            new ButtonBuilder()
                .setCustomId('bj_stand')
                .setLabel('Stand')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✋'),
            new ButtonBuilder()
                .setCustomId('bj_double')
                .setLabel('Double Down')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💰')
                .setDisabled(!canDoubleDown)
        );
}

async function handleHit(interaction, game, userLevel) {
    if (game.deck.length === 0) {
        game.deck = createDeck();
    }

    const newCard = drawCard(game.deck);
    game.playerHand.push(newCard);
    game.canDoubleDown = false;
    
    game.changed('playerHand', true);
    game.changed('deck', true);
    await game.save();

    const playerValue = calculateHand(game.playerHand);

    if (playerValue > 21) {
        return endGame(interaction, game, userLevel, 'bust');
    }

    const embed = createGameEmbed(interaction.user, game.playerHand, game.dealerHand, game.betAmount, false);
    const buttons = createButtons(false);

    await interaction.update({ embeds: [embed], components: [buttons] });
}

async function handleStand(interaction, game, userLevel) {
    while (calculateHand(game.dealerHand) < 17) {
        if (game.deck.length === 0) {
            game.deck = createDeck();
        }
        const newCard = drawCard(game.deck);
        game.dealerHand.push(newCard);
    }

    const playerValue = calculateHand(game.playerHand);
    const dealerValue = calculateHand(game.dealerHand);

    let result;
    if (dealerValue > 21) {
        result = 'dealer_bust';
    } else if (playerValue > dealerValue) {
        result = 'win';
    } else if (playerValue < dealerValue) {
        result = 'lose';
    } else {
        result = 'push';
    }

    await endGame(interaction, game, userLevel, result);
}

async function handleDouble(interaction, game, userLevel) {
    if (userLevel.xp < game.betAmount) {
        return interaction.reply({ 
            content: '❌ You don\'t have enough XP to double down!', 
            ephemeral: true 
        });
    }

    userLevel.xp -= game.betAmount;
    game.betAmount *= 2;
    await userLevel.save();

    if (game.deck.length === 0) {
        game.deck = createDeck();
    }

    const newCard = drawCard(game.deck);
    game.playerHand.push(newCard);
    
    game.changed('playerHand', true);
    game.changed('deck', true);
    await game.save();

    const playerValue = calculateHand(game.playerHand);

    if (playerValue > 21) {
        return endGame(interaction, game, userLevel, 'bust');
    }

    while (calculateHand(game.dealerHand) < 17) {
        if (game.deck.length === 0) {
            game.deck = createDeck();
        }
        const newCard = drawCard(game.deck);
        game.dealerHand.push(newCard);
    }

    const dealerValue = calculateHand(game.dealerHand);

    let result;
    if (dealerValue > 21) {
        result = 'dealer_bust';
    } else if (playerValue > dealerValue) {
        result = 'win';
    } else if (playerValue < dealerValue) {
        result = 'lose';
    } else {
        result = 'push';
    }

    await endGame(interaction, game, userLevel, result);
}

async function handleBlackjack(interaction, game, userLevel) {
    const dealerValue = calculateHand(game.dealerHand);
    const winAmount = Math.floor(game.betAmount * 2.5);

    game.status = dealerValue === 21 ? 'push' : 'won';
    await game.save();

    let resultText, color;
    
    if (dealerValue === 21) {
        resultText = '🤝 Push! Both got Blackjack!';
        color = 'Yellow';
        userLevel.xp += game.betAmount;
    } else {
        resultText = `🎉 BLACKJACK! You won ${winAmount} XP!`;
        color = 'Gold';
        userLevel.xp += winAmount;
    }

    await userLevel.save();
    await updateStats(interaction.user.id, interaction.guild.id, game.status, winAmount - game.betAmount, true);

    const embed = createGameEmbed(interaction.user, game.playerHand, game.dealerHand, game.betAmount, true);
    embed.setColor(color);
    embed.addFields({
        name: 'Result',
        value: resultText,
        inline: false
    });

    await interaction.editReply({ embeds: [embed], components: [] });
    await game.destroy();
}

async function endGame(interaction, game, userLevel, result) {
    let resultText, winAmount, color;

    switch(result) {
        case 'bust':
            resultText = `💥 Bust! You lost ${game.betAmount} XP.`;
            winAmount = 0;
            color = 'Red';
            game.status = 'lost';
            break;
        case 'dealer_bust':
            resultText = `🎉 Dealer busts! You won ${game.betAmount * 2} XP!`;
            winAmount = game.betAmount * 2;
            color = 'Green';
            game.status = 'won';
            break;
        case 'win':
            resultText = `🎉 You win! You won ${game.betAmount * 2} XP!`;
            winAmount = game.betAmount * 2;
            color = 'Green';
            game.status = 'won';
            break;
        case 'lose':
            resultText = `😔 Dealer wins. You lost ${game.betAmount} XP.`;
            winAmount = 0;
            color = 'Red';
            game.status = 'lost';
            break;
        case 'push':
            resultText = `🤝 Push! You get your ${game.betAmount} XP back.`;
            winAmount = game.betAmount;
            color = 'Yellow';
            game.status = 'push';
            break;
    }

    userLevel.xp += winAmount;
    await userLevel.save();
    await game.save();

    await updateStats(interaction.user.id, interaction.guild.id, game.status, winAmount - game.betAmount, false);

    const embed = createGameEmbed(interaction.user, game.playerHand, game.dealerHand, game.betAmount, true);
    embed.setColor(color);
    embed.addFields({
        name: 'Result',
        value: resultText,
        inline: false
    });

    await interaction.update({ embeds: [embed], components: [] });
    await game.destroy();
}

async function updateStats(userId, guildId, status, netWinnings, wasBlackjack) {
    const [stats] = await BlackjackStats.findOrCreate({
        where: { userId, guildId }
    });

    stats.gamesPlayed += 1;

    if (status === 'won') {
        stats.gamesWon += 1;
        stats.totalWinnings += netWinnings;
        if (netWinnings > stats.biggestWin) {
            stats.biggestWin = netWinnings;
        }
    } else if (status === 'lost') {
        stats.gamesLost += 1;
        stats.totalLosses += Math.abs(netWinnings);
    } else if (status === 'push') {
        stats.gamesPushed += 1;
    }

    if (wasBlackjack && status === 'won') {
        stats.blackjacks += 1;
    }

    await stats.save();
}