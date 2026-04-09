const mongoose = require('mongoose');

const uri = `mongodb://usmanzafarofficial125_db_user:sLhnHCf1A7A8KvXU@ac-rexzuux-shard-00-00.sx3cgzp.mongodb.net:27017,ac-rexzuux-shard-00-01.sx3cgzp.mongodb.net:27017,ac-rexzuux-shard-00-02.sx3cgzp.mongodb.net:27017/voice-app?ssl=true&authSource=admin&retryWrites=true&w=majority`;

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });
