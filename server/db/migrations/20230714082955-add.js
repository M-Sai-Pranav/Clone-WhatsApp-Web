'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql('create table requests (reqFrom varchar(100), reqTo varchar(100), reqFromMail varchar(100), reqToMail varchar(100))', [], (err)=>{
    if(err) {
      return err;
    }
    return;
  });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
