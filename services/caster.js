
const request = require('request')

// const baseURL = "http://api.hifivefootball.com:5550/reaction/"
const baseURL = "http://127.0.0.1:5550/reaction/"
exports.castNewMatchTalk = (talk) => {
    
    let url = baseURL + "matchtalk"
    
    request.post({url, form : {talkid: talk.talkid }} , function (error, response, body) {
        // console.log('error:', error); // Print the error if one occurred
        // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        // console.log('body:', body); // Print the HTML for the Google homepage.
      });    
};


exports.castMatchUpdate = (match) => {
    let url = baseURL + match.match_id +"/match"
    
    request.post({url, form : {match: match }} , function (error, response, body) {
        // console.log('error:', error); // Print the error if one occurred
        // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        // console.log('body:', body); // Print the HTML for the Google homepage.
      });    
}