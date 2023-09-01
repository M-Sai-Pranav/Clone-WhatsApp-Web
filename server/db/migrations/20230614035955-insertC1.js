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
  return db.runSql(`insert into contacts (chatReceivedFrom, chatReceivedFromMailID, sendTo, sendToMailID) values
   ('SaiPranav', 'saipranav.m168@gmail.com', 'RockStar', 'rockstarmsp2001@gmail.com'),
   ('RockStar', 'rockstarmsp2001@gmail.com', 'SaiPranav', 'saipranav.m168@gmail.com')`, [], (err)=>{
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
