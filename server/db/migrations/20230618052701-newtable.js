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
  return db.runSql(`create table messages ( Messageid int NOT NULL AUTO_INCREMENT,   chatFrom varchar(100), sendTo varchar(100), message varchar(100), timestamp varchar(100), PRIMARY KEY ( Messageid ) )`, [], (err)=>{
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
