const Guild = require('./models/guild');
const Infraction = require('./models/infraction');
const Member = require('./models/member');
const Level = require('./models/level');
const BlackjackGame = require('./models/blackjackGame');
const BlackjackStats = require('./models/blackjackStats');

Member.hasMany(Infraction);
Infraction.belongsTo(Member);

(async () => {
    console.log('Creating database tables...\n');
    
    try {
        await Guild.sync({ force: true });
        console.log('✅ Guild table created');
        
        await Member.sync({ force: true });
        console.log('✅ Member table created');
        
        await Infraction.sync({ force: true });
        console.log('✅ Infraction table created');
        
        await Level.sync({ force: true });
        console.log('✅ Level table created');
        
        await BlackjackGame.sync({ force: true });
        console.log('✅ BlackjackGame table created');
        
        await BlackjackStats.sync({ force: true });
        console.log('✅ BlackjackStats table created');
        
        console.log('\n✅ All database tables created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating database:', error);
        process.exit(1);
    }
})();