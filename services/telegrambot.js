const TelegramBot = require('node-telegram-bot-api');


var telegramBot = {};
telegramBot.token = '446008669:AAHUL5kiDFH8vgrTD19ESyOYWBjOXc6YPOo'
telegramBot.chatid = -288591423

const bot = new TelegramBot(telegramBot.token, {polling: false});


exports.waringNotify = function( request, response, error ){
    const status = error.status || 500;
    const code = error.code || 'UNEXPECTED_ERROR';
    const message = error.message || error.toString();
  
  
    const text = `<waring> : ${code} Error..!\n\n- IP: ${request.ip}\n- URI: ${request.method} ${request.originalUrl}\n- HEADERS: ${JSON.stringify(request.headers)}\n- BODY: ${JSON.stringify(request.body)}\n\n- STATUS: ${status}\n- CODE: ${code}\n- STACK: ${error.stack}`;
    
    
    bot.sendMessage(telegramBot.chatid,text);
};

exports.errorNotify = function( request, response, error  ){
    const status = error.status || 500;
    const code = error.code || 'UNEXPECTED_ERROR';
    const message = error.message || error.toString();
  

    const text = `<error> :  ${code} Error..!\n\n- IP: ${request.ip}\n- URI: ${request.method} ${request.originalUrl}\n- HEADERS: ${JSON.stringify(request.headers)}\n- BODY: ${JSON.stringify(request.body)}\n\n- STATUS: ${status}\n- CODE: ${code}\n- STACK: ${error.stack}`;
    
    
        bot.sendMessage(telegramBot.chatid,text);
};


exports.sqlerror = function( query, parameter , err  ){

    const message = err.message 
    const parameterString = JSON.stringify(parameter)
    const errString = JSON.stringify(err)

    const text = `<sqlerror>\n\n query ${query} \n\n parameter ${parameterString} \n\n ${errString}`;

        bot.sendMessage(telegramBot.chatid,text);
};

exports.sendSqlErrorMessage = function( err ){
    
        const errString = JSON.stringify(err)
    
        const text = `<sqlerror>\n\n error ${errString}`;
    
            bot.sendMessage(telegramBot.chatid,text);
    };