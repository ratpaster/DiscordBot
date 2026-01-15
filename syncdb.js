const Guild = require('./models/guild');
const Infraction = require('./models/infraction');
const Member = require('./models/member');

Member.hasMany(Infraction);
Infraction.belongsTo(Member);

// Guild.sync({ force: true });
//Guild.sync({ alter: true });
// Infraction.sync({ force: true });
// Member.sync({ force: true });