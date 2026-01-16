const Guild = require('./models/guild');
const Infraction = require('./models/infraction');
const Member = require('./models/member');
const Level = require('./models/level');

Member.hasMany(Infraction);
Infraction.belongsTo(Member);

(async () => {
    await Guild.sync({ alter: true });
    await Member.sync({ alter: true });
    await Infraction.sync({ alter: true });
    await Level.sync({ alter: true });
    
    console.log('✅ Database synced successfully!');
    process.exit(0);
})();