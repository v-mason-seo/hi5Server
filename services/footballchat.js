const db = require("./mysqlservice");

exports.add = content => {
  //player
  //team
  //match

  var mentionType = "";
  var mentionId = content.contentid;

  if (
    content.playerid === undefined &&
    content.teamid === undefined &&
    content.arenaid === undefined &&
    content.compid === undefined
  ) {
    mentionType = "B";
    mentionId = content.boardid;
  }

  if (content.playerid) {
    mentionType = "P";
    mentionId = content.playerid;
  }

  if (content.teamid) {
    mentionType = "T";
    mentionId = content.teamid;
  }

  if (content.arenaid) {
    mentionType = "M";
    mentionId = content.arenaid;
  }

  if (content.compid) {
    mentionType = "C";
    mentionId = content.compid;
  }

  let query = `
    insert into footballchats(mention_type, mention_id, content_id) 
           values (?, ?, ?)
			on duplicate key update content_id = ?, cnt = ifnull(cnt,0) + 1, updated = now()
    `;

  let parameter = [
    mentionType,
    mentionId,
    content.contentid,
    content.contentid
  ];

  db.excuteSql(query, parameter, (err, results) => {
    if (err) return;
    return;
  });
  // mention_id =
};
