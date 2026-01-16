const Member = require('./models/member');

(async () => {
    await Member.sync({ force: true });
    console.log('✅ Member table recreated');
    process.exit(0);
})();