const pg = require("pg");

const client = new pg.Client({
  host: "aws-0-ap-southeast-1.pooler.supabase.com",
  password: "abdur_Rahaman/123",
  user: "postgres.szqsjklrpylrvtddvbds",
  database: "first-webmap",
  port: "6543",
});

client.connect((err,res) => {
    if(!err) {
        console.log('database is connected.')
    } else {
        console.log('database fail to connect.')
    }
})

module.exports = client

